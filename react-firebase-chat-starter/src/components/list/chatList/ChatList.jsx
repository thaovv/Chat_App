import { useState, useEffect } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { onSnapshot, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const { currentUser } = useUserStore();
    const { chatId, changeChat } = useChatStore();
    const [input, setInput] = useState("");

    useEffect(() => {
        if (currentUser && currentUser.id) {
            const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
                if (res.exists() && res.data()?.chats) {
                    const items = res.data().chats;

                    const promises = items.map(async (item) => {
                        try {
                            const userDocRef = doc(db, "users", item.receiverId);
                            const userDocSnap = await getDoc(userDocRef);
                            if (userDocSnap.exists()) {
                                const user = userDocSnap.data();
                                return { ...item, user };
                            }
                            return item;
                        } catch (error) {
                            console.error("Error fetching user:", error);
                            return item;
                        }
                    });

                    const chatData = await Promise.all(promises);
                    setChats(chatData.sort((a, b) => b.updateAt - a.updateAt));
                } else {
                    setChats([]);
                }
            });

            return () => {
                unSub();
            };
        }
    }, [currentUser]);

    const handleSelect = async (chat) => {
        const userChats = chats.map((item) => {
            const { user, ...rest } = item;
            return rest;
        });
        const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
        userChats[chatIndex].isSeen = true;
        const userChatsRef = doc(db, "userchats", currentUser.id);
        try {
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.log(err);
        }
    };

    const filteredChats = chats.filter((c) => 
        c.user.username.toLowerCase().includes(input.toLowerCase()));

    return (
        <div className="chatList">
            <div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="Search Icon" />
                    <input type="text" placeholder="Search" onChange={(e) => setInput(e.target.value)}/>
                </div>
                <img
                    src={addMode ? "./minus.png" : "./plus.png"}
                    alt="Toggle Add"
                    className="add"
                    onClick={() => setAddMode((prev) => !prev)}
                />
            </div>

            {chats && chats.length > 0 &&
                filteredChats.map((chat) => (
                    <div className="item" key={chat.chatId} onClick={() => handleSelect(chat)}
                        style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}>
                        <img src={chat.user.blocked.includes(currentUser.id)
                            ?".avatar.png"
                            : chat.user?.avatar || "./avatar.png"} alt="Avatar" />
                        <div className="texts">
                            <span>{chat.user.blocked.includes(currentUser.id) ? "User" : chat.user?.username}</span>
                            <p>
                                {chat.lastMessage?.senderId === currentUser.id ? "Bạn: " : ""}
                                {chat.lastMessage?.text || "Chưa có tin nhắn"}
                            </p>
                        </div>
                    </div>
                ))
            }

            {addMode && <AddUser />}
        </div>
    );
};

export default ChatList;
