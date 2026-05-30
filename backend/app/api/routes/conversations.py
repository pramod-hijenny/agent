from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import Conversation, ConversationParticipant, Message, MessageSender, User
from app.schemas import ConversationCreate, ConversationRead, MessageCreate, MessageRead
from app.services.realtime import manager

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationRead])
async def list_conversations(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ConversationRead]:
    rows = (
        await session.scalars(
            select(Conversation)
            .join(ConversationParticipant)
            .where(ConversationParticipant.user_id == user.id)
            .order_by(Conversation.created_at.desc())
        )
    ).all()
    return [ConversationRead(id=row.id, title=row.title, created_at=row.created_at) for row in rows]


@router.post("", response_model=ConversationRead)
async def create_conversation(
    payload: ConversationCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConversationRead:
    participant_ids = list(dict.fromkeys([user.id, *payload.participant_user_ids]))
    conversation = Conversation(title=payload.title)
    session.add(conversation)
    await session.flush()
    session.add_all(
        ConversationParticipant(conversation_id=conversation.id, user_id=user_id)
        for user_id in participant_ids
    )
    await session.commit()
    await session.refresh(conversation)
    return ConversationRead(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
    )


@router.get("/{conversation_id}/messages", response_model=list[MessageRead])
async def list_messages(
    conversation_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[MessageRead]:
    participant = await session.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user.id,
        )
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Conversation not found")
    rows = (
        await session.scalars(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
    ).all()
    return [
        MessageRead(
            id=row.id,
            conversation_id=row.conversation_id,
            sender_user_id=row.sender_user_id,
            sender=row.sender.value,
            body=row.body,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post("/{conversation_id}/messages", response_model=MessageRead)
async def create_message(
    conversation_id: UUID,
    payload: MessageCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MessageRead:
    participants = (
        await session.scalars(
            select(ConversationParticipant).where(
                ConversationParticipant.conversation_id == conversation_id
            )
        )
    ).all()
    participant_ids = [row.user_id for row in participants]
    if user.id not in participant_ids:
        raise HTTPException(status_code=404, detail="Conversation not found")
    try:
        sender = MessageSender(payload.sender)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid sender") from exc
    message = Message(
        conversation_id=conversation_id,
        sender_user_id=user.id,
        sender=sender,
        body=payload.body,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    await manager.broadcast(
        participant_ids,
        {"type": "message.created", "conversation_id": str(conversation_id), "message_id": str(message.id)},
    )
    return MessageRead(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_user_id=message.sender_user_id,
        sender=message.sender.value,
        body=message.body,
        created_at=message.created_at,
    )
