import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { useLoginMutation } from '../features/Auth/authApi'
import chaddLogo from '../assets/chadd-logo.svg'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../features/Auth/authSlice'
{useLoginMutation}

const initialLoginData = {
    email:"",
    password:""
}


const Login = () => {

    const [Login,{isLoading,isError}] = useLoginMutation();
    const dispatch = useDispatch();

    const [formData,setFormData] = useState(()=>{
        const SavedData = localStorage.getItem("loginForm");

        if(!SavedData) return initialLoginData;

        try{
            const {email = ""} =  JSON.parse(SavedData)
            return {...initialLoginData,email};
        }catch{
            return initialLoginData
        }
    })

    useEffect(()=>{
        const SafeFormData ={
            email:formData.email
        }

        if(SafeFormData.email){
            localStorage.setItem("loginForm",JSON.stringify(SafeFormData));
        }else{
            localStorage.removeItem("loginForm");
        }
    },[formData])

    const changeHandler = (e)=>{
        setFormData(
            {...formData,
                [e.target.name] : e.target.value,
            }
        );
    };

    const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/v1/users/auth/google";
};

    const submithandler = async(e)=>{
        e.preventDefault();
        
    try {
     

        const {email,password,} = formData;

        const dataToSend = {
           
            email,
            password,
            
        }
    const response =  await Login(dataToSend).unwrap();
        dispatch(setCredentials(response.user))
      toast.success("login successful!");
      localStorage.removeItem("loginForm");
      setFormData(initialLoginData);

      

    } catch (error) {
      toast.error(error?.data?.message || " login failed ")
    }     

    }
  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-[#edf5ff] px-4 py-5 text-slate-900 sm:px-7 lg:grid lg:h-[100dvh] lg:min-h-0 lg:place-items-center lg:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_17%,rgba(157,210,255,.85),transparent_24%),radial-gradient(circle_at_20%_70%,rgba(225,238,255,.9),transparent_28%)]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-12%] h-[32rem] w-[130%] rounded-[50%] border-[3rem] border-[#b9d7ff]/60" />
      <div className="pointer-events-none absolute -bottom-64 left-[17%] h-[32rem] w-[110%] rounded-[50%] border-[2rem] border-[#8caefc]/35" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl lg:min-h-0 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <section className="relative hidden p-8 text-[#12336d] lg:flex lg:flex-col lg:justify-between">
          <div className="w-fit rounded-2xl bg-[#102d61] px-4 py-3 shadow-lg shadow-blue-950/10"><img className="h-auto w-36" src={chaddLogo} alt="Chadd" /></div>
          <div className="max-w-md pb-8"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4c76ce]">Welcome back</p><h1 className="mt-5 text-5xl font-semibold leading-[1.06] tracking-tight">Your people<br />are waiting.</h1><p className="mt-6 max-w-sm text-base leading-7 text-[#5371a8]">Pick up right where you left off with the conversations that feel like home.</p></div>
          <p className="text-sm font-medium text-[#6686ba]">Chadd — made for real conversations</p>
        </section>

        <section className="flex min-w-0 flex-col rounded-[1.75rem] border border-white/80 bg-white/85 px-5 py-7 shadow-[0_24px_70px_rgba(62,112,182,.18)] backdrop-blur-sm sm:px-10 sm:py-9 lg:my-0 lg:px-11 lg:py-7">
          <div className="mb-5 inline-flex w-fit rounded-xl bg-[#102d61] px-3 py-2 shadow-md shadow-blue-950/10 lg:hidden"><img className="h-auto w-28" src={chaddLogo} alt="Chadd" /></div>
          <div className="max-w-md"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f7ce0]">Welcome back</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102d61] sm:text-4xl">Sign in to Chadd</h2><p className="mt-3 text-sm leading-6 text-[#6b83ab] sm:text-base">Enter your details to continue your conversations.</p></div>

          <form className="mt-6 max-w-md space-y-4 lg:mt-5 lg:space-y-3" onSubmit={submithandler}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#274776]">Email address</label>
              <input id="email" className="h-12 w-full rounded-lg border border-[#dce8fa] bg-[#f7faff] px-4 text-sm text-[#173664] outline-none transition placeholder:text-[#9eb3d2] hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 lg:h-10" type="email" name="email" value={formData.email} placeholder="email@example.com" autoComplete="new-username" onChange={changeHandler} />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#274776]">Password</label>
              <input id="password" className="h-12 w-full rounded-lg border border-[#dce8fa] bg-[#f7faff] px-4 text-sm text-[#173664] outline-none transition placeholder:text-[#9eb3d2] hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 lg:h-10" type="password" value={formData.password} name="password" placeholder="Enter your password" autoComplete="current-password" onChange={changeHandler} />
            </div>

            <button className="flex h-12 w-full items-center justify-center rounded-lg bg-[#347ff0] px-4 text-sm font-semibold text-white shadow-lg shadow-[#347ff0]/25 transition duration-200 hover:bg-[#246ee0] hover:shadow-xl hover:shadow-[#347ff0]/30 focus:outline-none focus:ring-4 focus:ring-[#347ff0]/25 disabled:cursor-not-allowed disabled:bg-[#96bdf4] disabled:shadow-none lg:h-10" disabled={isLoading}>
              {isLoading ? "Signing you in..." : "Sign in"}
            </button>

            {isError && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">Login failed. Please try again.</p>}
          </form>

          <div className="my-4 flex max-w-md items-center gap-4 lg:my-3" aria-hidden="true"><div className="h-px flex-1 bg-[#dbe8fa]" /><span className="text-xs font-medium uppercase tracking-[0.16em] text-[#90a8ca]">or</span><div className="h-px flex-1 bg-[#dbe8fa]" /></div>

          <button className="flex h-12 w-full max-w-md items-center justify-center gap-3 rounded-lg border border-[#dce8fa] bg-white px-4 text-sm font-semibold text-[#274776] shadow-sm transition hover:border-[#aec7ed] hover:bg-[#f8fbff] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#4d89ed]/10 active:scale-[0.99] lg:h-10" type="button" onClick={handleGoogleLogin}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.24c0-.75-.07-1.47-.19-2.16H12v4.09h5.24a4.48 4.48 0 0 1-1.94 2.94v2.65h3.13c1.83-1.68 2.92-4.16 2.92-7.52Z" /><path fill="#34A853" d="M12 21.75c2.62 0 4.82-.87 6.43-2.36l-3.13-2.65c-.87.58-1.98.92-3.3.92-2.53 0-4.68-1.71-5.45-4.01H3.31v2.73A9.72 9.72 0 0 0 12 21.75Z" /><path fill="#FBBC05" d="M6.55 13.65A5.83 5.83 0 0 1 6.24 12c0-.57.1-1.12.31-1.65V7.62H3.31A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.06 4.38l3.24-2.73Z" /><path fill="#EA4335" d="M12 6.34c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.43 14.62 2.25 12 2.25a9.72 9.72 0 0 0-8.69 5.37l3.24 2.73C7.32 8.05 9.47 6.34 12 6.34Z" /></svg>
            Continue with Google
          </button>
          <p className="mt-4 max-w-md text-center text-xs leading-5 text-[#8ca2c2] lg:mt-3">Secure, simple, and made for real conversations.</p>
        </section>
      </div>
    </main>
  )
}

export default Login
