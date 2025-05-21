import "./chat.css";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { onSnapshot, updateDoc, doc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase"; // Đảm bảo bạn đã cấu hình Firebase Storage

const Chat = () => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [chats, setChats] = useState([]);
    const [img, setImg] = useState({
        file: null,
        url: "",
    });

    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
    const { currentUser } = useUserStore();
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChats(res.data());
        });
        return () => {
            unSub();
        };
    }, [chatId]);

    // Hàm upload ảnh lên Firebase Storage
    const upload = async (file) => {
        const storageRef = ref(storage, `chat-images/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
    };

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleImage = (e) => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    };

    const handleSend = async () => {
        if (text.trim() === "") return; // Kiểm tra tin nhắn rỗng

        if (!currentUser || !currentUser.id) {
            console.error("Current user is not defined");
            return;
        }

        let imgUrl = null;

        try {
            if (img.file) {
                imgUrl = await upload(img.file);
            }

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion({
                    text,
                    senderId: currentUser.id,
                    createAt: new Date(),
                    ...(imgUrl && { img: imgUrl }),
                }),
            });

            // Kiểm tra người dùng
            if (!user) {
                console.error("Chat user is not defined");
                return;
            }

            const userIDs = [currentUser.id, user.id];

            //Cập nhật trạng thái của người dùng trong danh sách chat
            userIDs.forEach(async (id) => {
                const userChatRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatRef);

                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();
                    const chatIndex = userChatsData.chats.findIndex(
                        (c) => c.chatId === chatId
                    );
                    userChatsData.chats[chatIndex].lastMessage = text;
                    userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? false : true;
                    userChatsData.chats[chatIndex].updateAt = Date.now();
                    await updateDoc(userChatRef, {
                        chats: userChatsData.chats,
                    });
                }
            });
            

        } catch (err) {
            console.error(err);
        }

        setImg({
            file: null,
            url: "",
        });
        setText("");
    };

    return (
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user?.username}</span>
                        <p>Online</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                    <img src="./info.png" alt="" />
                </div>
            </div>
            <div className="center">
                {chats?.messages?.map((message) => (
                    <div className={message.senderId === currentUser?.id ? "messageown" : "message"} key={message?.createAt}>
                        <div className="texts">
                            {message.img && <img src={message.img} alt="" />}
                            <p>{message.text}</p>
                        </div>
                    </div>
                ))}
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
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className="emoji">
                    <img
                        src="./emoji.png"
                        alt=""
                        onClick={() => setOpen((prev) => !prev)}
                    />
                    <div className="picker">
                        <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                    </div>
                </div>
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
