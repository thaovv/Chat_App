import {
    collection,
    doc,
    getDocs,
    query,
    where,
    setDoc,
    serverTimestamp,
    arrayUnion,
    updateDoc,
} from "firebase/firestore";
import "./addUser.css";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";
import { useState } from "react";

const AddUser = () => {
    const [user, setUser] = useState(null);
    const { currentUser } = useUserStore();

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");

        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const foundUser = querySnapshot.docs[0].data();
                foundUser.id = querySnapshot.docs[0].id; // Lưu id lại
                setUser(foundUser);
            } else {
                setUser(null);
                console.log("Không tìm thấy người dùng.");
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleAdd = async () => {
        if (!user || !user.id || !currentUser || !currentUser.id) {
            console.log("Thiếu thông tin người dùng.");
            return;
        }

        const chatRef = collection(db, "chats");
        const userChatsRef = collection(db, "userchats");

        try {
            // Tạo đoạn chat mới
            const newChatRef = doc(chatRef);
            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: [],
            });

            // Đảm bảo document userchats tồn tại
            await setDoc(doc(userChatsRef, currentUser.id), {}, { merge: true });
            await setDoc(doc(userChatsRef, user.id), {}, { merge: true });

            // Tạo dữ liệu chat
            const currentUserChat = {
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: user.id,
                updateAt: Date.now(),
            };

            const userChat = {
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: currentUser.id,
                updateAt: Date.now(),
            };

            // Ghi dữ liệu vào Firestore
            await updateDoc(doc(userChatsRef, currentUser.id), {
                chats: arrayUnion(currentUserChat),
            });

            await updateDoc(doc(userChatsRef, user.id), {
                chats: arrayUnion(userChat),
            });

            alert("Đã thêm bạn thành công!");
        } catch (err) {
            console.log("Lỗi khi thêm user:", err);
        }
    };

    return (
        <div className="addUser">
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button>Search</button>
            </form>

            {user && (
                <div className="user">
                    <div className="detail">
                        <img src={user.avatar || "./avatar.png"} alt="Avatar" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAdd}>Add User</button>
                </div>
            )}
        </div>
    );
};

export default AddUser;
