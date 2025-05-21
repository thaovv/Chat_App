import { auth } from "../../lib/firebase"
import "./detail.css"
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { useEffect } from "react";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useState } from "react";
import { useRef } from "react";
const Detail = () => {
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore();

    const handleBlock = async () => {
        if(!user) return;
        const userDocRef = doc(db, "users", currentUser.id);

        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ?  arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock();
        }catch (err){
            console.log(err);
        }
    }
    return (
        <div className="detail">
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="" />
                <h2>{user?.username}</h2>
                <p></p>
            </div>

            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Chat Settings</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Privacy & help</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared photos</span>
                        <img src="./arrowDown.png" alt="" />
                    </div>

                    <div className="photos">
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="data:image/jpeg;base64,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" alt="" />
                                <span>photo_sfsfs</span>
                            </div>
                            <img src="./download.png" alt="" className="icon"/>
                        </div>
                        
                      
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared files</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                <button onClick={handleBlock}>{
                        isCurrentUserBlocked ? "You are blocked" : isReceiverBlocked ? "You blocked" : "Block User"
                    }</button>
                <button className="logout" onClick={() => auth.signOut()}>Logout</button>
            </div>

        </div>
    )
}
 
export default Detail