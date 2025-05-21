import { toast } from "react-toastify";
import "./login.css"
import { useState } from "react";
import "react-toastify/dist/ReactToastify.css"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import uploadImage from "../../lib/uploadImage";

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loading, setLoading] = useState(false);

    const handleAvatar = (e) => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    }
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        try{
            // Đăng nhập với Firebase Authentication
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Đăng nhập thành công!")
        }catch(err) {
            console.log(err);
            toast.error(err.message)
        }finally {
            setLoading(false);
        }
    }
    
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);
        

        try {
            // Tạo user với Firebase Authentication
            const res = await createUserWithEmailAndPassword(auth, email, password);
            
            // Upload ảnh lên Backend Node.js thay vì Firebase Storage
            let imgUrl = "";
            if (avatar.file) {
                // Truyền userId cho backend để liên kết ảnh với user
                imgUrl = await uploadImage(avatar.file, res.user.uid);
            }
            
            // Vẫn tiếp tục sử dụng Firebase Firestore cho dữ liệu người dùng
            await setDoc(doc(db, "users", res.user.uid), {
                uid: res.user.uid,
                username,
                email,
                avatar: imgUrl,
                blocked: [],
            });

            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: [],
            });

            toast.success("Tạo tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ!")
        } catch (err) {
            console.log(err);
            toast.error(err.message)
        }finally {
            setLoading(false);
        }
    }

    return (
        <div className="login">
            <div className="item">
                <h2>Welcome back,</h2>
                <form onSubmit={handleLogin} autoComplete="off">
                    <input type="text" placeholder="Email" name="email" autoComplete="off"/>
                    <input type="password" placeholder="Password" name="password" autoComplete="off"/>
                    <button disabled={loading}>{loading ? "Loading" :"Sign In"}</button>
                </form>
            </div>
            <div className="separator"></div>
            <div className="item">
                <h2>Create an Account</h2>
                <form onSubmit={handleRegister} autoComplete="off">
                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.png"} alt="" />
                        Upload an image</label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                    <input type="text" placeholder="Username" name="username" autoComplete="off"/>
                    <input type="text" placeholder="Email" name="email" autoComplete="off"/>
                    <input type="password" placeholder="Password" name="password" autoComplete="off"/>
                    <button disabled={loading}>{loading ? "Loading" :"Sign Up"}</button>
                </form>
            </div>
        </div>
    )
}

export default Login