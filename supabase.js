import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://ornscnhsokqvuqvxlbsx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybnNjbmhzb2txdnVxdnhsYnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTYzNjksImV4cCI6MjA5MDE5MjM2OX0.YvUwk9RMdt7z0BHndyEYuP-8Fh7hfKI1LKuBTfKWuZE"
);

function authMessage(message, isError = true) {
  if (window.setAuthMessage) {
    window.setAuthMessage(message, isError);
  } else {
    console.log(message);
  }
}

function markOtpFlow() {
  sessionStorage.setItem("otp_login_flow", "1");
}

function clearOtpFlow() {
  sessionStorage.removeItem("otp_login_flow");
}

function isOtpFlow() {
  return sessionStorage.getItem("otp_login_flow") === "1";
}

window.saveUserProgress = async function (userId, data) {
  const payload = {
    user_id: userId,
    current_unit_index: data.currentUnitIndex ?? 0,
    current_chapter_index: data.currentChapterIndex ?? 0,
    current_kanji_index: data.currentKanjiIndex ?? 0,
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
    learned: Array.isArray(data.learned) ? data.learned : [],
    weekly_history: Array.isArray(data.weeklyHistory) ? data.weeklyHistory : [],
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("study_progress")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("保存进度失败：", error);
  }
};

window.loadUserProgress = async function (userId) {
  const { data, error } = await supabase
    .from("study_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("读取进度失败：", error);
    return null;
  }

  return data;
};

window.setPasswordForCurrentUser = async function (newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error("设置密码失败：", error);
    return false;
  }

  return true;
};

window.logoutUser = async function () {
  clearOtpFlow();

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("退出失败：", error);
  }
};

let sendBusy = false;
let verifyBusy = false;
let passwordBusy = false;
let hasHandledInitialSession = false;

window.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendCodeBtn");
  const verifyBtn = document.getElementById("verifyBtn");
  const passwordBtn = document.getElementById("passwordLoginBtn");

  console.log("sendCodeBtn:", !!sendBtn);
  console.log("verifyBtn:", !!verifyBtn);
  console.log("passwordLoginBtn:", !!passwordBtn);

  sendBtn?.addEventListener("click", async () => {
    console.log("点击了发送验证码");

    if (sendBusy) return;
    sendBusy = true;
    authMessage("");

    try {
      const email = document.getElementById("email")?.value.trim();

      if (!email) {
        authMessage("请输入邮箱");
        alert("请输入邮箱");
        return;
      }

      clearOtpFlow();
      hasHandledInitialSession = false;

      const result = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      });

      console.log("send otp result:", result);

      if (result.error) {
        console.error(result.error);
        authMessage(`发送失败：${result.error.message}`);
        alert(`发送失败：${result.error.message}`);
        return;
      }

      authMessage("验证码已发送，请检查邮箱", false);
      alert("验证码已发送，请检查邮箱");
    } catch (err) {
      console.error("send otp catch:", err);
      authMessage(`发送验证码时报错：${err.message}`);
      alert("发送验证码时报错：" + err.message);
    } finally {
      sendBusy = false;
    }
  });

  verifyBtn?.addEventListener("click", async () => {
    console.log("点击了验证并登录");

    if (verifyBusy) return;
    verifyBusy = true;
    authMessage("");

    try {
      const email = document.getElementById("email")?.value.trim();
      const token = document.getElementById("code")?.value.trim();

      console.log("verify email:", email);
      console.log("verify token:", token);

      if (!email || !token) {
        authMessage("请输入邮箱和验证码");
        alert("请输入邮箱和验证码");
        return;
      }

      markOtpFlow();

      const result = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email"
      });

      console.log("verify otp result:", result);

      if (result.error) {
        clearOtpFlow();
        console.error(result.error);
        authMessage(`验证失败：${result.error.message}`);
        alert(`验证失败：${result.error.message}`);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        clearOtpFlow();
        console.error("getSession error:", sessionError);
        authMessage(`登录成功，但获取会话失败：${sessionError.message}`);
        alert(`登录成功，但获取会话失败：${sessionError.message}`);
        return;
      }

      const user = sessionData?.session?.user;

      if (!user) {
        clearOtpFlow();
        authMessage("登录成功，但没有拿到用户信息");
        alert("登录成功，但没有拿到用户信息");
        return;
      }

      const saved = await window.loadUserProgress?.(user.id);

      console.log("准备直接触发 onOtpLoginSuccess");

      clearOtpFlow();
      hasHandledInitialSession = true;
      authMessage("登录成功", false);

      window.onOtpLoginSuccess?.(user, saved);
    } catch (err) {
      clearOtpFlow();
      console.error("verify otp catch:", err);
      authMessage(`验证码登录时报错：${err.message}`);
      alert("验证码登录时报错：" + err.message);
    } finally {
      verifyBusy = false;
    }
  });

  passwordBtn?.addEventListener("click", async () => {
    console.log("点击了密码登录");

    if (passwordBusy) return;
    passwordBusy = true;
    authMessage("");

    try {
      clearOtpFlow();

      const email =
        document.getElementById("passwordEmail")?.value.trim() ||
        document.getElementById("email")?.value.trim();

      const password =
        document.getElementById("password")?.value.trim() ||
        document.getElementById("passwordLoginInput")?.value.trim();

      if (!email || !password) {
        authMessage("请输入邮箱和密码");
        alert("请输入邮箱和密码");
        return;
      }

      const result = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log("password login result:", result);

      if (result.error) {
        console.error(result.error);
        authMessage(`登录失败：${result.error.message}`);
        alert(`登录失败：${result.error.message}`);
        return;
      }

      const user = result.data.user;
      const saved = await window.loadUserProgress?.(user.id);

      console.log("准备触发 onPasswordLoginSuccess");
      hasHandledInitialSession = true;
      window.onPasswordLoginSuccess?.(user, saved);
    } catch (err) {
      console.error("password login catch:", err);
      authMessage(`密码登录时报错：${err.message}`);
      alert("密码登录时报错：" + err.message);
    } finally {
      passwordBusy = false;
    }
  });
});

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("auth state changed:", event, session);

  if (event === "SIGNED_OUT") {
    clearOtpFlow();
    hasHandledInitialSession = false;
    window.onUserLoggedOut?.();
    return;
  }

  if (!session?.user) return;

  if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") {
    return;
  }

  if (hasHandledInitialSession) {
    return;
  }

  try {
    const saved = await window.loadUserProgress?.(session.user.id);

    if (isOtpFlow()) {
      console.log("真正登录成功，准备进入主页面");
      clearOtpFlow();
      hasHandledInitialSession = true;

      if (typeof window.onOtpLoginSuccess === "function") {
        window.onOtpLoginSuccess(session.user, saved);
      } else {
        const loginPage = document.getElementById("loginPage");
        const mainPage = document.getElementById("mainPage");
        const studyView = document.getElementById("studyView");
        const favoritesView = document.getElementById("favoritesView");
        const reviewView = document.getElementById("reviewView");
        const setPasswordModal = document.getElementById("setPasswordModal");

        window.appState = window.appState || {};
        window.appState.currentUser = session.user;
        window.appState.justLoggedInByOtp = true;

        if (typeof window.applySavedProgress === "function") {
          window.applySavedProgress(saved);
        }

        loginPage?.classList.add("hidden");
        mainPage?.classList.remove("hidden");
        studyView?.classList.remove("hidden");
        favoritesView?.classList.add("hidden");
        reviewView?.classList.add("hidden");
        setPasswordModal?.classList.remove("hidden");

        if (typeof window.renderAll === "function") {
          window.renderAll();
        }
      }
      return;
    }

    console.log("准备触发 onPasswordLoginSuccess");
    hasHandledInitialSession = true;

    if (typeof window.onPasswordLoginSuccess === "function") {
      window.onPasswordLoginSuccess(session.user, saved);
    } else {
      const loginPage = document.getElementById("loginPage");
      const mainPage = document.getElementById("mainPage");
      const studyView = document.getElementById("studyView");
      const favoritesView = document.getElementById("favoritesView");
      const reviewView = document.getElementById("reviewView");

      window.appState = window.appState || {};
      window.appState.currentUser = session.user;

      if (typeof window.applySavedProgress === "function") {
        window.applySavedProgress(saved);
      }

      loginPage?.classList.add("hidden");
      mainPage?.classList.remove("hidden");
      studyView?.classList.remove("hidden");
      favoritesView?.classList.add("hidden");
      reviewView?.classList.add("hidden");

      if (typeof window.renderAll === "function") {
        window.renderAll();
      }
    }
  } catch (err) {
    console.error("onAuthStateChange callback error:", err);
  }
});

(async function handleSession() {
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  console.log("current session:", session);

  if (!session?.user) {
    window.onUserLoggedOut?.();
    return;
  }

  if (hasHandledInitialSession) {
    return;
  }

  const saved = await window.loadUserProgress?.(session.user.id);

  if (isOtpFlow()) {
    console.log("handleSession 检测到 OTP 流程");
    clearOtpFlow();
    hasHandledInitialSession = true;
    window.onOtpLoginSuccess?.(session.user, saved);
    return;
  }

  hasHandledInitialSession = true;
  window.onPasswordLoginSuccess?.(session.user, saved);
})();