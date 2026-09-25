import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useRegisterMutation } from '../features/Auth/authApi'
import chaddLogo from '../assets/chadd-logo.svg'
{useRegisterMutation}

const initialFormData = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
};

const Register = () => {

    const [register,{isLoading,isError}] = useRegisterMutation()
 
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem("registerForm");

        if (!savedData) return initialFormData;

        try {
            const { username = "", email = "", gender = "" } = JSON.parse(savedData);
            return { ...initialFormData, username, email, gender };
        } catch {
            return initialFormData;
        }
    });

  useEffect(() => {
    const safeFormData = {
      username: formData.username,
      email: formData.email,
      gender: formData.gender,
    };
    if (safeFormData.username || safeFormData.email || safeFormData.gender) {
      localStorage.setItem("registerForm", JSON.stringify(safeFormData));
    } else {
      localStorage.removeItem("registerForm");
    }
    }, [formData]);


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
        if(formData.password !== formData.confirmPassword){
            toast.error("Passwords don't match");
             return ;
        }

    try {
     

        const {username,email,password,gender} = formData;

        const dataToSend = {
            username,
            email,
            password,
            gender
        }
      await register(dataToSend).unwrap();

      toast.success("Registration successful!");
      localStorage.removeItem("registerForm");
      setFormData(initialFormData);

      

    } catch (error) {
      toast.error(error?.data?.message || " registration failed ")
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
        <div className="max-w-md pb-8"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4c76ce]">A better way to connect</p><h2 className="mt-5 text-5xl font-semibold leading-[1.06] tracking-tight">Talk freely.<br />Feel closer.</h2><p className="mt-6 max-w-sm text-base leading-7 text-[#5371a8]">A private, thoughtful space for the people and conversations that matter to you.</p></div>
        <p className="text-sm font-medium text-[#6686ba]">Chadd — made for real conversations</p>
      </section>
      <section className="flex min-w-0 flex-col rounded-[1.75rem] border border-white/80 bg-white/85 px-5 py-7 shadow-[0_24px_70px_rgba(62,112,182,.18)] backdrop-blur-sm sm:px-10 sm:py-9 lg:my-0 lg:px-11 lg:py-6">
        <div className="mb-5 inline-flex w-fit rounded-xl bg-[#102d61] px-3 py-2 shadow-md shadow-blue-950/10 lg:hidden"><img className="h-auto w-28" src={chaddLogo} alt="Chadd" /></div>
        <div className="max-w-md"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f7ce0]">Join Chadd</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102d61] sm:text-4xl">Create your account</h1><p className="mt-3 text-sm leading-6 text-[#6b83ab] sm:text-base">A few details and you’ll be ready to start connecting.</p></div>

        <form className="mt-6 max-w-md space-y-3.5 lg:mt-4 lg:space-y-2.5" action="" onSubmit={submithandler}>
            <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-[#274776]">Username</label>
            <input
             id="username"
             className="h-12 w-full rounded-lg border border-[#dce8fa] bg-[#f7faff] px-4 text-sm text-[#173664] outline-none transition placeholder:text-[#9eb3d2] hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 lg:h-10"
             type="text"
             placeholder='krish'
             name='username'
             value={formData.username}
             autoComplete='new-username'
             onChange={changeHandler} 
             />
             </div>
             <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#274776]">Email address</label>
            <input
             id="email"
             className="h-12 w-full rounded-lg border border-[#dce8fa] bg-[#f7faff] px-4 text-sm text-[#173664] outline-none transition placeholder:text-[#9eb3d2] hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 lg:h-10"
             type="email"
             placeholder='krishsipai@gmail.com'
             name='email'
             value={formData.email}
             autoComplete='email'
             onChange={changeHandler} 
             />
             </div>
             <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium text-[#274776]">Gender</label>
           <select
                id="gender"
                className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-[#dce8fa] bg-[#f7faff] px-4 text-sm text-[#173664] outline-none transition hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 lg:h-10"
                name="gender"
                value={formData.gender}
                onChange={changeHandler }
            >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:gap-2.5">
              <div className="min-w-0 space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#274776]">Password</label>
            <input
             id="password"
             className="h-12 w-full rounded-lg border border-[#dce8fa] bg-[#f7faff] px-4 text-sm text-[#173664] outline-none transition placeholder:text-[#9eb3d2] hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 lg:h-10"
             type="password"
             placeholder='password'
             name='password'
             value={formData.password}
             autoComplete='new-password'
             onChange={changeHandler} 
             />
             </div>
             <div className="min-w-0 space-y-2">
             <label htmlFor="confirmPassword" className="text-sm font-medium text-[#274776]">Confirm password</label>
            <input
             id="confirmPassword"
             className="h-12 w-full rounded-lg border border-[#dce8fa] bg-[#f7faff] px-4 text-sm text-[#173664] outline-none transition placeholder:text-[#9eb3d2] hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 lg:h-10"
             type="Password"
             placeholder='password'
             name='confirmPassword'
             value={formData.confirmPassword}
             onChange={changeHandler} 
             />
             </div>
             </div>

             <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#347ff0] px-4 text-sm font-semibold text-white shadow-lg shadow-[#347ff0]/25 transition duration-200 hover:bg-[#246ee0] hover:shadow-xl hover:shadow-[#347ff0]/30 focus:outline-none focus:ring-4 focus:ring-[#347ff0]/25 disabled:cursor-not-allowed disabled:bg-[#96bdf4] disabled:shadow-none lg:h-10" type='submit' disabled={isLoading}>
                {
                    isLoading? "Creating your account..." : "Create account"
                }
             </button>

             {
                isError && (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">Registration failed. Please try again.</p>
                )
             }
             
        </form>

        <div className="my-4 flex max-w-md items-center gap-4 lg:my-2.5" aria-hidden="true">
          <div className="h-px flex-1 bg-[#dbe8fa]" />
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#90a8ca]">or</span>
          <div className="h-px flex-1 bg-[#dbe8fa]" />
        </div>

        <button className="flex h-12 w-full max-w-md items-center justify-center gap-3 rounded-lg border border-[#dce8fa] bg-white px-4 text-sm font-semibold text-[#274776] shadow-sm transition hover:border-[#aec7ed] hover:bg-[#f8fbff] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#4d89ed]/10 active:scale-[0.99] lg:h-10" type="button" onClick={handleGoogleLogin}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.24c0-.75-.07-1.47-.19-2.16H12v4.09h5.24a4.48 4.48 0 0 1-1.94 2.94v2.65h3.13c1.83-1.68 2.92-4.16 2.92-7.52Z" />
              <path fill="#34A853" d="M12 21.75c2.62 0 4.82-.87 6.43-2.36l-3.13-2.65c-.87.58-1.98.92-3.3.92-2.53 0-4.68-1.71-5.45-4.01H3.31v2.73A9.72 9.72 0 0 0 12 21.75Z" />
              <path fill="#FBBC05" d="M6.55 13.65A5.83 5.83 0 0 1 6.24 12c0-.57.1-1.12.31-1.65V7.62H3.31A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.06 4.38l3.24-2.73Z" />
              <path fill="#EA4335" d="M12 6.34c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.43 14.62 2.25 12 2.25a9.72 9.72 0 0 0-8.69 5.37l3.24 2.73C7.32 8.05 9.47 6.34 12 6.34Z" />
            </svg>
            Continue with Google
        </button>
        <p className="mt-4 max-w-md text-center text-xs leading-5 text-[#8ca2c2] lg:mt-2.5">By creating an account, you agree to connect respectfully and keep Chadd a welcoming place.</p>
      </section>
    </div>
    </main>
  )
}

export default Register
