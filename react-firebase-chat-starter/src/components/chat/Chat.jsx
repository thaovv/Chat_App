import "./chat.css";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import {
    onSnapshot,
    updateDoc,
    doc,
    arrayUnion,
    getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { format } from "date-fns";

const Chat = () => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [chats, setChats] = useState(null);
    const [img, setImg] = useState({ file: null, url: "" });
    const [sending, setSending] = useState(false);

    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
    const { currentUser } = useUserStore();
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats]);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            const data = res.data();
            if (data) setChats(data);
        });
        return () => unSub();
    }, [chatId]);

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImg({ file, url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if (!text.trim() && !img.url) return;
        if (!currentUser || !currentUser.id) return;

        setSending(true);

        try {
            const messageObj = {
                id: Date.now().toString(),
                text,
                senderId: currentUser.id,
                createAt: new Date(),
                isSeen: false,
                ...(img.url && { img: img.url }),
            };

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion(messageObj),
            });

            const userIDs = [currentUser.id, user.id];

            for (const id of userIDs) {
                const userChatRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatRef);

                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();
                    const chatIndex = userChatsData.chats.findIndex(
                        (c) => c.chatId === chatId
                    );

                    if (chatIndex !== -1) {
                        userChatsData.chats[chatIndex].lastMessage = {
                            text,
                            senderId: currentUser.id,
                        };
                        userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
                        userChatsData.chats[chatIndex].updateAt = Date.now();

                        await updateDoc(userChatRef, {
                            chats: userChatsData.chats,
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Send message failed:", err);
        }

        setText("");
        setImg({ file: null, url: "" });
        setSending(false);
    };

    useEffect(() => {
        const markAsSeen = async () => {
            if (!chats?.messages?.length) return;

            const lastMsg = chats.messages[chats.messages.length - 1];
            const isReceiver = lastMsg.senderId !== currentUser.id;

            if (isReceiver && !lastMsg.isSeen) {
                const updatedMessages = [...chats.messages];
                updatedMessages[updatedMessages.length - 1].isSeen = true;

                await updateDoc(doc(db, "chats", chatId), {
                    messages: updatedMessages,
                });
            }
        };

        markAsSeen();
    }, [chats]);

    return (
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user?.username}</span>
                        {/* <p>Online</p> */}
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                    <img src="./info.png" alt="" />
                </div>
            </div>

            <div className="center">
                {Array.isArray(chats?.messages) &&
                    chats.messages.map((message, index) => {
                        const isOwn = message.senderId === currentUser?.id;
                        const isLast = index === chats.messages.length - 1;

                        const createdAtDate = message.createAt instanceof Date
                            ? message.createAt
                            : message.createAt?.seconds
                                ? new Date(message.createAt.seconds * 1000)
                                : null;

                        const formattedTime = createdAtDate
                            ? format(createdAtDate, "HH:mm")
                            : "";

                        const showSeen = isOwn && message.isSeen && isLast;

                        return (
                            <div className={isOwn ? "messageown" : "message"} key={message.id || index}>
                                <div className="texts">
                                    {message.img && <img src={message.img} alt="" />}
                                    {message.text && <p>{message.text}</p>}
                                    {formattedTime && <span className="time">{formattedTime}</span>}
                                    {showSeen && <span className="seen">Đã xem</span>}
                                </div>
                            </div>
                        );
                    })}
                {img.url && (
                    <div className="messageown">
                        <div className="texts">
                            <img src={img.url} alt="" />
                        </div>
                    </div>
                )}
                <div ref={endRef}></div>
            </div>

            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./img.png" alt="" />
                    </label>
                    <input
                        type="file"
                        id="file"
                        style={{ display: "none" }}
                        onChange={handleImage}
                    />
                    <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" />
                </div>
                <input
                    type="text"
                    placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You cannot  send a message":"Type a message..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverBlocked || sending}
                />
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
                    <div className="picker">
                        <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                    </div>
                </div>
                <button
                    className="sendButton"
                    onClick={handleSend}
                    disabled={isCurrentUserBlocked || isReceiverBlocked || sending}
                >
                    {sending ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    );
};

export default Chat;
