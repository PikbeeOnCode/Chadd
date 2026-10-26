import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import { setCredentials } from "../features/Auth/authSlice";
import chaddLogo from "../assets/chadd-logo.svg";
import {
  useUpdateProfileMutation,
  useGetProfileQuery,
} from "../features/Auth/authApi";

const Field = ({ label, children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="block text-sm font-semibold text-slate-700">{label}</label>
    {children}
  </div>
);

const inputClass =
  "w-full rounded-xl border border-[#dce8fa] bg-[#f7faff] px-4 py-3 text-sm text-[#173664] outline-none transition placeholder:text-[#9eb3d2] hover:border-[#aec7ed] focus:border-[#4d89ed] focus:bg-white focus:ring-4 focus:ring-[#4d89ed]/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [editing, setEditing] = useState(false);

  const {
    data,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useGetProfileQuery();

  useEffect(() => {
    if (data?.data?.user) dispatch(setCredentials(data.data.user));
    console.log(data)
  }, [data, dispatch]);

  const [userProfileDraft, setUserProfileDraft] = useState({
    avatar: null,
    username: "",
    email: "",
    gender: "",
    bio: "",
  });

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const changeHandler = (e) => {
    const { name, value, files } = e.target;
    setUserProfileDraft((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const updateProfileHandler = () => {
    setUserProfileDraft({
      avatar:user?.avatar_url || null,
      username: user?.username || "",
      email: user?.email || "",
      gender: user?.gender || "",
      bio: user?.bio || "",
    });
    setEditing(true);
  };

  const saveUpdateProfileHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("username", userProfileDraft.username);
      formData.append("gender", userProfileDraft.gender);
      formData.append("bio", userProfileDraft.bio);
      if (userProfileDraft.avatar) formData.append("avatar", userProfileDraft.avatar);

      const response = await updateProfile(formData).unwrap();
      if (response?.data?.user) dispatch(setCredentials(response.data.user));
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };

  const cancelUpdateProfileHandler = () => setEditing(false);

  if (isProfileLoading || isProfileError || !user) {
    const message = isProfileLoading
      ? "Loading your profile…"
      : isProfileError
        ? "We couldn’t load your profile. Please try again."
        : "Please log in to view your profile.";
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#edf5ff] px-5 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_17%,rgba(157,210,255,.75),transparent_24%),radial-gradient(circle_at_20%_70%,rgba(225,238,255,.9),transparent_28%)]" />
        <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(62,112,182,.18)] backdrop-blur-sm">
          <div className="mx-auto mb-6 inline-flex rounded-xl bg-[#102d61] px-3 py-2 shadow-md shadow-blue-950/10"><img className="h-auto w-28" src={chaddLogo} alt="Chadd" /></div>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5ff] text-[#347ff0]">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </div>
          <p className="text-base font-semibold text-slate-800">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#edf5ff] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_10%,rgba(157,210,255,.68),transparent_25%),radial-gradient(circle_at_10%_75%,rgba(225,238,255,.9),transparent_30%)]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-12%] h-[32rem] w-[130%] rounded-[50%] border-[3rem] border-[#b9d7ff]/45" />
      <div className="relative mx-auto max-w-5xl">
        <header className="mb-7 flex flex-col gap-7 sm:mb-9 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-6 inline-flex rounded-xl bg-[#102d61] px-3 py-2 shadow-md shadow-blue-950/10"><img className="h-auto w-28" src={chaddLogo} alt="Chadd" /></div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4f7ce0]">Your account</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#102d61] sm:text-4xl">Profile</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b83ab] sm:text-base">Manage your personal details and how others see you.</p>
          </div>
        </header>

        {!editing ? (
          <section className="overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/95 shadow-[0_24px_70px_rgba(62,112,182,.16)] backdrop-blur-sm">
            <div className="relative h-28 overflow-hidden bg-gradient-to-r from-[#102d61] via-[#347ff0] to-[#83c7ff] sm:h-40">
              <div className="absolute -right-10 -top-28 h-64 w-64 rounded-full border-[22px] border-white/10 sm:-right-4 sm:-top-40 sm:h-96 sm:w-96" />
              <div className="absolute -bottom-36 right-[28%] h-64 w-64 rounded-full border-[18px] border-white/10 sm:-bottom-48 sm:h-80 sm:w-80" />
            </div>
            <div className="px-5 pb-7 sm:px-10 sm:pb-10">
              <div className="flex flex-col gap-5 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-4">
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="h-32 w-32 shrink-0 rounded-2xl border-4 border-white bg-[#edf5ff] object-contain shadow-lg sm:h-36 sm:w-36"
                  />
                  <div className="min-w-0 pb-1">
                    <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{user.username}</h2>
                    <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={updateProfileHandler}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#347ff0] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#347ff0]/25 transition hover:bg-[#246ee0] focus:outline-none focus:ring-4 focus:ring-[#347ff0]/25 sm:w-auto"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="m13.5 3.5 3 3M3 17l3.7-.8L16 6.9a2.12 2.12 0 0 0-3-3L3.7 13.2 3 17Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Edit profile
                </button>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-7 sm:mt-10 sm:pt-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Personal information</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</p>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-800">{user.username || "Not added"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email address</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-800">{user.email || "Not added"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gender</p>
                    <p className="mt-2 text-sm font-semibold capitalize text-slate-800">{user.gender || "Not specified"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">About</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{user.bio || "Add a short bio to tell people a little about yourself."}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <form onSubmit={saveUpdateProfileHandler} className="overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/95 shadow-[0_24px_70px_rgba(62,112,182,.16)] backdrop-blur-sm">
            <div className="border-b border-slate-100 px-5 py-6 sm:px-9 sm:py-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4f7ce0]">Personal details</p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#102d61] sm:text-3xl">Edit your profile</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b83ab]">Keep your information up to date.</p>
            </div>
            <div className="grid gap-6 px-5 py-6 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-6 sm:px-9 sm:py-8">
              <Field label="Profile photo" className="sm:col-span-2">
                <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#c9daf4] bg-[#f7faff] p-4 sm:flex-row sm:items-center">
                  <img src={user.avatar_url} alt="Current profile" className="h-16 w-16 rounded-xl bg-[#edf5ff] object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">Choose a new photo</p>
                    <p className="mt-1 text-xs text-slate-500">Use a clear image that represents you.</p>
                  </div>
                  <input type="file" name="avatar" accept="image/*" onChange={changeHandler} className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#347ff0] file:shadow-sm hover:file:bg-[#edf5ff] sm:w-auto" />
                </div>
              </Field>

              <Field label="Username">
                <input type="text" name="username" value={userProfileDraft.username} onChange={changeHandler} className={inputClass} placeholder="Your name" />
              </Field>
              <Field label="Email address">
                <input type="email" name="email" value={userProfileDraft.email} readOnly className={`${inputClass} text-slate-500`} />
                <span className="block text-xs text-slate-400">Email address can’t be changed here.</span>
              </Field>
              <Field label="Gender">
                <select name="gender" value={userProfileDraft.gender} onChange={changeHandler} className={inputClass}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Bio" className="sm:col-span-2">
                <textarea name="bio" value={userProfileDraft.bio} onChange={changeHandler} rows={4} className={`${inputClass} resize-y`} placeholder="Share a little about yourself…" />
              </Field>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-[#e5eefb] bg-[#f8fbff] px-5 py-5 sm:flex-row sm:justify-end sm:px-9">
              <button type="button" onClick={cancelUpdateProfileHandler} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-100">Cancel</button>
              <button type="submit" disabled={isUpdating} className="rounded-xl bg-[#347ff0] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#347ff0]/25 transition hover:bg-[#246ee0] focus:outline-none focus:ring-4 focus:ring-[#347ff0]/25 disabled:cursor-wait disabled:opacity-60">{isUpdating ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        )}
        <p className="mt-6 text-center text-xs text-slate-400">Your profile information is used to personalize your experience.</p>
      </div>
    </main>
  );
};

export default Profile;
