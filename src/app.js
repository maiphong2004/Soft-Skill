import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";

const h = React.createElement;
const TOKEN_KEY = "softSkillDashboard.token";

const skills = [
  { key: "communication", label: "Giao tiếp", target: 82 },
  { key: "teamwork", label: "Làm việc nhóm", target: 80 },
  { key: "leadership", label: "Lãnh đạo", target: 76 },
  { key: "criticalThinking", label: "Tư duy phản biện", target: 78 },
  { key: "timeManagement", label: "Quản lý thời gian", target: 80 },
  { key: "adaptability", label: "Thích nghi", target: 77 },
];

const students = [
  {
    id: "sv001",
    name: "Nguyễn Minh Anh",
    major: "Quản trị kinh doanh",
    year: "Năm 2",
    attendance: 92,
    trend: 9,
    scores: {
      communication: 74,
      teamwork: 86,
      leadership: 61,
      criticalThinking: 70,
      timeManagement: 68,
      adaptability: 79,
    },
    evidence: ["Thuyết trình tốt nhưng thiếu kết luận rõ", "Ít nhận vai trò điều phối nhóm"],
  },
  {
    id: "sv002",
    name: "Trần Quốc Huy",
    major: "Công nghệ thông tin",
    year: "Năm 3",
    attendance: 78,
    trend: 4,
    scores: {
      communication: 62,
      teamwork: 73,
      leadership: 66,
      criticalThinking: 82,
      timeManagement: 57,
      adaptability: 71,
    },
    evidence: ["Nộp bài nhóm sát hạn", "Phản biện kỹ thuật tốt nhưng trình bày còn dài"],
  },
  {
    id: "sv003",
    name: "Lê Hoài Phương",
    major: "Marketing",
    year: "Năm 1",
    attendance: 96,
    trend: 13,
    scores: {
      communication: 88,
      teamwork: 80,
      leadership: 73,
      criticalThinking: 76,
      timeManagement: 84,
      adaptability: 83,
    },
    evidence: ["Chủ động nhận phản hồi", "Cần luyện ra quyết định khi nhóm bất đồng"],
  },
  {
    id: "sv004",
    name: "Phạm Gia Bảo",
    major: "Tài chính",
    year: "Năm 4",
    attendance: 84,
    trend: -2,
    scores: {
      communication: 71,
      teamwork: 64,
      leadership: 70,
      criticalThinking: 75,
      timeManagement: 62,
      adaptability: 68,
    },
    evidence: ["Tham gia đều nhưng đóng góp nhóm chưa ổn định", "Cần ưu tiên công việc theo mức ảnh hưởng"],
  },
];

const suggestionBank = {
  communication: {
    title: "Luyện giao tiếp có cấu trúc",
    action: "Mỗi tuần chuẩn bị 1 bài trình bày 3 phút theo khung: vấn đề, luận điểm, minh chứng, kết luận.",
    resource: "CLB thuyết trình, phản hồi ngang hàng, rubric trình bày.",
  },
  teamwork: {
    title: "Tăng đóng góp trong nhóm",
    action: "Dùng bảng phân công RACI nhỏ cho bài tập nhóm và cập nhật tiến độ sau mỗi buổi học.",
    resource: "Mẫu họp nhóm 15 phút, checklist vai trò nhóm.",
  },
  leadership: {
    title: "Thử vai trò điều phối",
    action: "Nhận điều phối một nhiệm vụ nhỏ: chia việc, tổng hợp quyết định, nhắc deadline.",
    resource: "Workshop lãnh đạo tình huống, nhật ký phản tư sau dự án.",
  },
  criticalThinking: {
    title: "Rèn tư duy phản biện",
    action: "Khi đọc tài liệu, ghi ít nhất 2 giả định, 1 bằng chứng ủng hộ và 1 phản ví dụ.",
    resource: "Bài tập case study, kỹ thuật 5 Whys.",
  },
  timeManagement: {
    title: "Ổn định quản lý thời gian",
    action: "Lập kế hoạch tuần bằng ma trận ưu tiên và chia bài lớn thành mốc 25 phút.",
    resource: "Pomodoro, Eisenhower matrix, lịch học cá nhân.",
  },
  adaptability: {
    title: "Tăng khả năng thích nghi",
    action: "Sau mỗi thay đổi yêu cầu bài tập, ghi 3 phương án xử lý và chọn phương án ít rủi ro nhất.",
    resource: "Bài tập mô phỏng, phản hồi từ cố vấn học tập.",
  },
};

const assessmentQuestions = {
  communication: [
    {
      prompt: "Khi thuyết trình nhóm, bạn thấy người nghe bắt đầu mất tập trung. Bạn sẽ làm gì?",
      options: [
        { text: "Tiếp tục đọc đúng nội dung đã chuẩn bị để không bị sai kế hoạch.", score: 45 },
        { text: "Dừng ngắn, đặt một câu hỏi gợi mở rồi tóm tắt lại ý chính bằng ví dụ gần gũi.", score: 95 },
        { text: "Nói nhanh hơn để kết thúc phần trình bày sớm.", score: 35 },
        { text: "Chuyển ngay sang slide tiếp theo mà không giải thích thêm.", score: 55 },
      ],
    },
    {
      prompt: "Một bạn trong nhóm góp ý rằng phần trình bày của bạn chưa rõ. Cách phản hồi nào phù hợp nhất?",
      options: [
        { text: "Hỏi lại phần nào chưa rõ, cảm ơn góp ý và điều chỉnh cách diễn đạt.", score: 100 },
        { text: "Giải thích rằng bạn đã chuẩn bị kỹ nên vấn đề có thể do người nghe.", score: 35 },
        { text: "Im lặng và để trưởng nhóm xử lý.", score: 45 },
        { text: "Chỉ sửa vài từ trên slide mà không hỏi thêm.", score: 65 },
      ],
    },
    {
      prompt: "Trong cuộc họp nhóm, hai bạn tranh luận gay gắt và nói chồng lên nhau. Bạn nên làm gì?",
      options: [
        { text: "Chọn phe có ý kiến giống mình để cuộc họp nhanh kết thúc.", score: 40 },
        { text: "Đề nghị từng người nói lần lượt, tóm tắt điểm chung và điểm khác trước khi quyết định.", score: 95 },
        { text: "Rời cuộc họp vì không muốn căng thẳng.", score: 25 },
        { text: "Nhắn riêng cho một bạn sau cuộc họp thay vì xử lý trong nhóm.", score: 60 },
      ],
    },
  ],
  teamwork: [
    {
      prompt: "Bạn nhận thấy một thành viên nhóm liên tục trễ hạn. Bạn sẽ xử lý thế nào?",
      options: [
        { text: "Tự làm thay toàn bộ phần của bạn đó để kịp nộp.", score: 55 },
        { text: "Trao đổi lý do trễ hạn, chia nhỏ nhiệm vụ và thống nhất mốc kiểm tra gần hơn.", score: 95 },
        { text: "Báo giảng viên ngay mà không trao đổi với nhóm.", score: 45 },
        { text: "Bỏ qua vì đó không phải phần việc của mình.", score: 25 },
      ],
    },
    {
      prompt: "Nhóm có quá nhiều ý tưởng khác nhau cho bài tập. Bạn nên làm gì?",
      options: [
        { text: "Đề xuất tiêu chí đánh giá rồi cùng nhóm chọn phương án phù hợp nhất.", score: 100 },
        { text: "Chọn ý tưởng của người nói nhiều nhất để tránh mất thời gian.", score: 45 },
        { text: "Đề nghị ghép tất cả ý tưởng vào bài.", score: 55 },
        { text: "Để trưởng nhóm tự quyết, mình chỉ làm phần được giao.", score: 60 },
      ],
    },
    {
      prompt: "Bạn hoàn thành phần việc sớm hơn các bạn khác. Hành động nào tốt nhất?",
      options: [
        { text: "Chờ đến ngày nộp rồi mới xem lại toàn bài.", score: 45 },
        { text: "Chủ động kiểm tra phần liên quan, hỗ trợ bạn đang chậm và cập nhật tiến độ chung.", score: 95 },
        { text: "Báo rằng mình đã xong và không tham gia thêm.", score: 50 },
        { text: "Làm lại phần của người khác theo ý mình.", score: 60 },
      ],
    },
  ],
  leadership: [
    {
      prompt: "Bạn được giao điều phối một bài thuyết trình nhóm. Việc đầu tiên nên làm là gì?",
      options: [
        { text: "Tự chia toàn bộ nội dung theo cảm tính để tiết kiệm thời gian.", score: 45 },
        { text: "Làm rõ mục tiêu, deadline, năng lực từng thành viên rồi phân vai cụ thể.", score: 100 },
        { text: "Đợi mọi người tự chọn phần rồi tổng hợp sau.", score: 60 },
        { text: "Chỉ tập trung làm phần của mình thật tốt.", score: 35 },
      ],
    },
    {
      prompt: "Một thành viên phản đối kế hoạch bạn đề xuất. Bạn nên phản ứng thế nào?",
      options: [
        { text: "Yêu cầu làm theo vì bạn là người điều phối.", score: 30 },
        { text: "Hỏi lý do phản đối, so sánh với mục tiêu nhóm và điều chỉnh nếu hợp lý.", score: 95 },
        { text: "Bỏ qua ý kiến đó nếu đa số không nói gì.", score: 50 },
        { text: "Chuyển trách nhiệm quyết định cho giảng viên.", score: 45 },
      ],
    },
    {
      prompt: "Gần đến hạn nộp, nhóm bị chậm tiến độ. Cách xử lý nào tốt nhất?",
      options: [
        { text: "Họp nhanh để xác định phần quan trọng, phân lại việc và đặt mốc hoàn thành trong ngày.", score: 100 },
        { text: "Nhắc mọi người cố gắng hơn nhưng không thay đổi kế hoạch.", score: 50 },
        { text: "Tự làm hết phần còn lại.", score: 55 },
        { text: "Chấp nhận nộp muộn vì cả nhóm đều bận.", score: 20 },
      ],
    },
  ],
  criticalThinking: [
    {
      prompt: "Bạn đọc được một số liệu trên mạng để đưa vào bài thuyết trình. Bạn nên làm gì?",
      options: [
        { text: "Dùng ngay nếu số liệu nghe có vẻ hợp lý.", score: 30 },
        { text: "Kiểm tra nguồn, năm công bố, phương pháp thu thập và so sánh với nguồn khác.", score: 100 },
        { text: "Chỉ ghi 'theo Internet' để tránh sai nguồn.", score: 25 },
        { text: "Hỏi bạn cùng nhóm xem có nên dùng không.", score: 55 },
      ],
    },
    {
      prompt: "Nhóm chọn một giải pháp nhưng bạn thấy có rủi ro. Bạn nên trình bày thế nào?",
      options: [
        { text: "Nói giải pháp đó sai và yêu cầu đổi phương án.", score: 45 },
        { text: "Nêu rủi ro kèm bằng chứng, mức ảnh hưởng và đề xuất cách giảm rủi ro.", score: 95 },
        { text: "Giữ im lặng vì nhóm đã thống nhất.", score: 25 },
        { text: "Chỉ nói rằng mình có cảm giác không ổn.", score: 50 },
      ],
    },
    {
      prompt: "Khi nhận một yêu cầu bài tập chưa rõ, bạn sẽ làm gì?",
      options: [
        { text: "Làm theo cách mình hiểu để kịp tiến độ.", score: 45 },
        { text: "Tách yêu cầu thành tiêu chí, xác định điểm chưa rõ và hỏi lại bằng câu hỏi cụ thể.", score: 95 },
        { text: "Chờ bạn khác bắt đầu rồi làm theo.", score: 35 },
        { text: "Tìm bài mẫu trên mạng và làm giống cấu trúc đó.", score: 55 },
      ],
    },
  ],
  timeManagement: [
    {
      prompt: "Bạn có một bài thuyết trình phải nộp sau 7 ngày. Cách lên kế hoạch nào hợp lý nhất?",
      options: [
        { text: "Đợi gần hạn để có áp lực làm nhanh hơn.", score: 20 },
        { text: "Chia thành các mốc: tìm tài liệu, viết dàn ý, làm slide, luyện tập và kiểm tra.", score: 100 },
        { text: "Làm slide trước, nội dung tính sau.", score: 45 },
        { text: "Chỉ đặt mục tiêu hoàn thành trước hạn một ngày.", score: 60 },
      ],
    },
    {
      prompt: "Trong cùng một ngày bạn có nhiều việc. Bạn nên ưu tiên thế nào?",
      options: [
        { text: "Làm việc dễ trước để có cảm giác hoàn thành.", score: 45 },
        { text: "Xếp việc theo mức quan trọng và hạn nộp, xử lý việc ảnh hưởng lớn trước.", score: 95 },
        { text: "Làm việc nào người khác nhắc nhiều nhất.", score: 50 },
        { text: "Làm nhiều việc cùng lúc để tiết kiệm thời gian.", score: 35 },
      ],
    },
    {
      prompt: "Bạn nhận ra mình sẽ trễ hạn phần việc nhóm. Hành động nào tốt nhất?",
      options: [
        { text: "Báo sớm cho nhóm, nêu phần đã làm, phần còn thiếu và đề xuất mốc mới khả thi.", score: 95 },
        { text: "Cố làm một mình và chỉ báo khi đã quá hạn.", score: 35 },
        { text: "Nộp bản chưa hoàn chỉnh mà không giải thích.", score: 45 },
        { text: "Nhờ bạn khác làm thay toàn bộ.", score: 40 },
      ],
    },
  ],
  adaptability: [
    {
      prompt: "Giảng viên thay đổi yêu cầu bài tập khi nhóm đã làm được một nửa. Bạn nên làm gì?",
      options: [
        { text: "Giữ nguyên hướng cũ vì đã mất nhiều công sức.", score: 30 },
        { text: "So sánh yêu cầu mới với phần đã làm, giữ lại phần dùng được và điều chỉnh kế hoạch.", score: 95 },
        { text: "Làm lại từ đầu ngay lập tức.", score: 55 },
        { text: "Chờ trưởng nhóm quyết định, mình chưa cần làm gì.", score: 45 },
      ],
    },
    {
      prompt: "Bạn phải dùng một công cụ mới để làm bài nhóm. Cách tiếp cận nào hiệu quả nhất?",
      options: [
        { text: "Từ chối vì công cụ đó không quen thuộc.", score: 20 },
        { text: "Học chức năng cần thiết trước, thử trên phần nhỏ rồi chia sẻ cách dùng với nhóm.", score: 95 },
        { text: "Dùng công cụ cũ và chuyển đổi kết quả sau.", score: 55 },
        { text: "Nhờ một bạn khác làm toàn bộ phần liên quan đến công cụ.", score: 40 },
      ],
    },
    {
      prompt: "Bạn nhận phản hồi rằng cách làm hiện tại chưa phù hợp. Bạn sẽ làm gì?",
      options: [
        { text: "Xem phản hồi như dữ liệu, hỏi rõ tiêu chí và điều chỉnh phần quan trọng nhất trước.", score: 100 },
        { text: "Chỉ sửa những lỗi nhỏ dễ sửa.", score: 55 },
        { text: "Bảo vệ cách làm ban đầu vì bạn đã cố gắng.", score: 35 },
        { text: "Đổi toàn bộ hướng làm mà không phân tích phản hồi.", score: 50 },
      ],
    },
  ],
};

function average(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function className(...names) {
  return names.filter(Boolean).join(" ");
}

function hasSkillData(student) {
  return Boolean(student?.scores);
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${ token } ` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Không thể kết nối backend.");
  }

  return payload;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [activeView, setActiveView] = useState("student");
  const selected = currentUser;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoadingSession(false);
      return;
    }

    apiRequest("/api/me")
      .then(({ user }) => setCurrentUser(user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoadingSession(false));
  }, []);

  const analysis = useMemo(() => {
    if (!hasSkillData(selected)) {
      return null;
    }

    const skillRows = skills.map((skill) => ({
      ...skill,
      score: selected.scores[skill.key],
      gap: skill.target - selected.scores[skill.key],
    }));
    const weakest = [...skillRows].sort((a, b) => b.gap - a.gap).slice(0, 3);
    const overall = average(skillRows.map((skill) => skill.score));
    const readiness =
      overall >= 80 ? "Sẵn sàng thực tập" : overall >= 70 ? "Cần củng cố có trọng tâm" : "Cần kèm cặp sát";

    return { skillRows, weakest, overall, readiness };
  }, [selected]);

  const cohort = useMemo(() => {
    const rows = skills.map((skill) => ({
      ...skill,
      score: average(students.map((student) => student.scores[skill.key])),
    }));
    return {
      rows,
      overall: average(rows.map((skill) => skill.score)),
      atRisk: students.filter((student) => average(Object.values(student.scores)) < 70).length,
    };
  }, []);

  async function handleRegister(form) {
    try {
      const { token, user } = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem(TOKEN_KEY, token);
      setCurrentUser(user);
      setActiveView("student");
      return "";
    } catch (error) {
      return error.message;
    }
  }

  async function handleLogin(form) {
    try {
      const { token, user } = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem(TOKEN_KEY, token);
      setCurrentUser(user);
      setActiveView("student");
      return "";
    } catch (error) {
      return error.message;
    }
  }

  async function handleRequestPasswordReset(form) {
    try {
      const { message } = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(form),
      });
      return { ok: true, message };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function handleResetPassword(form) {
    try {
      const { message } = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(form),
      });
      return { ok: true, message };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function handleLogout() {
    await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    setActiveView("student");
  }

  async function handleSaveAssessment(form) {
    try {
      const { user } = await apiRequest("/api/me/assessment", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setCurrentUser(user);
      setActiveView("student");
      return "";
    } catch (error) {
      return error.message;
    }
  }

  if (isLoadingSession) {
    return h("main", { className: "authShell" }, h("section", { className: "authCard loadingCard" }, h("h2", null, "Đang kiểm tra phiên đăng nhập...")));
  }

  if (!currentUser) {
    return h(AuthPage, {
      onLogin: handleLogin,
      onRegister: handleRegister,
      onRequestPasswordReset: handleRequestPasswordReset,
      onResetPassword: handleResetPassword,
    });
  }

  return h(
    "main",
    { className: "shell" },
    h(Header, { activeView, setActiveView, currentUser, onLogout: handleLogout }),
    h(
      "section",
      { className: "toolbar", "aria-label": "Bộ lọc dashboard" },
      h(
        "label",
        { className: "field" },
        h("span", null, "Tài khoản"),
        h(
          "select",
          { value: selected.id, disabled: true },
          h("option", { value: selected.id }, selected.name)
        )
      ),
      h(
        "div",
        { className: "segmented", role: "tablist", "aria-label": "Chế độ xem" },
        h(SegmentButton, { active: activeView === "student", onClick: () => setActiveView("student"), children: "Cá nhân" }),
        h(SegmentButton, { active: activeView === "cohort", onClick: () => setActiveView("cohort"), children: "Lớp học" }),
        h(SegmentButton, { active: activeView === "plan", onClick: () => setActiveView("plan"), children: "Kế hoạch" }),
        h(SegmentButton, { active: activeView === "assessment", onClick: () => setActiveView("assessment"), children: "Bài kiểm tra" })
      )
    ),
    activeView === "student" && h(StudentDashboard, { selected, analysis }),
    activeView === "cohort" && h(CohortDashboard, { cohort }),
    activeView === "plan" && h(PlanDashboard, { selected, analysis }),
    activeView === "assessment" && h(AssessmentDashboard, { selected, onSave: handleSaveAssessment })
  );
}

function AuthPage({ onLogin, onRegister, onRequestPasswordReset, onResetPassword }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetRequested, setResetRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentCode: "",
    password: "",
    resetCode: "",
    major: "",
    year: "Năm 1",
  });

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setResetRequested(false);
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setNotice("");
  }

  async function submit(event) {
    event.preventDefault();

    if (mode === "forgot") {
      if (!form.email.trim()) {
        setError("Vui lòng nhập email đã đăng ký.");
        return;
      }

      setIsSubmitting(true);
      if (!resetRequested) {
        const result = await onRequestPasswordReset({ email: form.email });
        setIsSubmitting(false);
        if (result.ok) {
          setResetRequested(true);
          setNotice(result.message);
          return;
        }

        setError(result.message);
        return;
      }

      if (!form.resetCode.trim() || !form.password.trim()) {
        setIsSubmitting(false);
        setError("Vui lòng nhập mã xác thực và mật khẩu mới.");
        return;
      }

      const result = await onResetPassword({
        email: form.email,
        code: form.resetCode,
        password: form.password,
      });
      setIsSubmitting(false);
      if (result.ok) {
        setMode("login");
        setResetRequested(false);
        setNotice(result.message);
        setForm((current) => ({ ...current, password: "", resetCode: "" }));
        return;
      }

      setError(result.message);
      return;
    }

    if (!form.email.trim() || !form.studentCode.trim() || !form.password.trim()) {
      setError("Vui lòng nhập email, mã số sinh viên và mật khẩu.");
      return;
    }

    if (mode === "register") {
      if (!form.name.trim() || !form.major.trim()) {
        setError("Vui lòng nhập họ tên và ngành học.");
        return;
      }

      setIsSubmitting(true);
      const message = await onRegister({
        ...form,
        name: form.name.trim(),
        major: form.major.trim(),
      });
      setIsSubmitting(false);
      setError(message);
      return;
    }

    setIsSubmitting(true);
    setError(await onLogin(form));
    setIsSubmitting(false);
  }

  return h(
    "main",
    { className: "authShell" },
    h(
      "section",
      { className: "authHero" },
      h("p", { className: "eyebrow" }, "Dashboard kỹ năng mềm"),
      h("h1", null, "Đăng nhập để theo dõi tiến bộ kỹ năng mềm"),
      h("p", { className: "heroText" }, "Tài khoản mới được tạo ở trạng thái trống, chưa có điểm kỹ năng, minh chứng hay kế hoạch cá nhân.")
    ),
    h(
      "section",
      { className: "authCard" },
      h(
        "div",
        { className: "segmented authSwitch", role: "tablist", "aria-label": "Chọn đăng nhập hoặc đăng ký" },
        h(SegmentButton, { active: mode === "login", onClick: () => changeMode("login"), children: "Đăng nhập" }),
        h(SegmentButton, { active: mode === "register", onClick: () => changeMode("register"), children: "Đăng ký" })
      ),
      h(
        "form",
        { className: "authForm", onSubmit: submit },
        mode === "register" &&
          h(
            React.Fragment,
            null,
            h(TextInput, { label: "Họ tên", value: form.name, onChange: (value) => updateField("name", value), placeholder: "Nguyễn Văn A" }),
            h(TextInput, { label: "Mã số sinh viên", value: form.studentCode, onChange: (value) => updateField("studentCode", value), placeholder: "SV001234" }),
            h(TextInput, { label: "Ngành học", value: form.major, onChange: (value) => updateField("major", value), placeholder: "Công nghệ thông tin" }),
            h(
              "label",
              { className: "field authField" },
              h("span", null, "Năm học"),
              h(
                "select",
                { value: form.year, onChange: (event) => updateField("year", event.target.value) },
                ["Năm 1", "Năm 2", "Năm 3", "Năm 4"].map((year) => h("option", { key: year, value: year }, year))
              )
            )
          ),
        mode === "login" &&
          h(TextInput, { label: "Mã số sinh viên", value: form.studentCode, onChange: (value) => updateField("studentCode", value), placeholder: "SV001234" }),
        h(TextInput, { label: "Email", type: "email", value: form.email, onChange: (value) => updateField("email", value), placeholder: "sinhvien@example.com" }),
        mode !== "forgot" &&
          h(TextInput, { label: "Mật khẩu", type: "password", value: form.password, onChange: (value) => updateField("password", value), placeholder: "Nhập mật khẩu" }),
        mode === "forgot" &&
          h(
            React.Fragment,
            null,
            resetRequested &&
              h(TextInput, { label: "Mã xác thực từ email", value: form.resetCode, onChange: (value) => updateField("resetCode", value), placeholder: "Nhập mã 6 số" }),
            resetRequested &&
              h(TextInput, { label: "Mật khẩu mới", type: "password", value: form.password, onChange: (value) => updateField("password", value), placeholder: "Nhập mật khẩu mới" })
          ),
        mode === "login" &&
          h("button", { className: "linkButton", type: "button", onClick: () => changeMode("forgot") }, "Quên mật khẩu?"),
        mode === "forgot" &&
          h("button", { className: "linkButton", type: "button", onClick: () => changeMode("login") }, "Quay lại đăng nhập"),
        notice && h("p", { className: "formSuccess" }, notice),
        error && h("p", { className: "formError" }, error),
        h(
          "button",
          { className: "submitButton", type: "submit", disabled: isSubmitting },
          isSubmitting
            ? "Đang xử lý..."
            : mode === "register"
              ? "Tạo tài khoản"
              : mode === "forgot" && !resetRequested
                ? "Gửi mã xác thực"
                : mode === "forgot"
                  ? "Đặt lại mật khẩu"
                  : "Đăng nhập"
        )
      ),
      h("p", { className: "authNote" }, "Tài khoản được lưu qua backend. Frontend chỉ giữ token phiên đăng nhập.")
    )
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text" }) {
  return h(
    "label",
    { className: "field authField" },
    h("span", null, label),
    h("input", {
      type,
      value,
      placeholder,
      onChange: (event) => onChange(event.target.value),
    })
  );
}

function Header({ activeView, setActiveView, currentUser, onLogout }) {
  return h(
    "header",
    { className: "hero" },
    h("div", null, h("p", { className: "eyebrow" }, "Dashboard kỹ năng mềm"), h("h1", null, "Trực quan hoá năng lực và gợi ý cải thiện cho sinh viên"), h("p", { className: "heroText" }, "Theo dõi điểm kỹ năng, phát hiện khoảng cách so với mục tiêu và đề xuất hoạt động rèn luyện dựa trên dữ liệu học tập, tự đánh giá và phản hồi nhóm.")),
    h(
      "div",
      { className: "heroActions" },
      h("span", { className: "userBadge" }, currentUser.name),
      h(
        "button",
        { className: "primaryAction", onClick: () => setActiveView(activeView === "plan" ? "student" : "plan") },
        activeView === "plan" ? "Xem tổng quan" : "Xem kế hoạch"
      ),
      h("button", { className: "ghostAction", onClick: onLogout }, "Đăng xuất")
    )
  );
}

function SegmentButton({ active, onClick, children }) {
  return h(
    "button",
    { className: className("segment", active && "active"), onClick, role: "tab", "aria-selected": active },
    children
  );
}

function StudentDashboard({ selected, analysis }) {
  if (!analysis) {
    return h(EmptyStudentState, { selected });
  }

  return h(
    "div",
    { className: "dashboardGrid" },
    h(ProfilePanel, { selected, analysis }),
    h(RadarPanel, { rows: analysis.skillRows }),
    h(ScorePanel, { rows: analysis.skillRows }),
    h(RecommendationPanel, { weakest: analysis.weakest }),
    h(EvidencePanel, { evidence: selected.evidence })
  );
}

function EmptyStudentState({ selected }) {
  return h(
    "div",
    { className: "dashboardGrid" },
    h(
      "section",
      { className: "panel profilePanel emptyProfile" },
      h("div", { className: "avatar" }, selected.name.split(" ").slice(-1)[0][0]),
      h("div", null, h("h2", null, selected.name), h("p", null, `${ selected.major } • ${ selected.year } `)),
      h("div", { className: "statusPill emptyPill" }, "Chưa có dữ liệu kỹ năng")
    ),
    h(
      "section",
      { className: "panel emptyState" },
      h("h2", null, "Tài khoản mới chưa có dữ liệu"),
      h("p", null, "Sinh viên này chưa có điểm kỹ năng, tỷ lệ chuyên cần, minh chứng hoặc lịch sử đánh giá. Hãy làm bài kiểm tra kỹ năng mềm để hệ thống tự tính điểm và hiển thị biểu đồ, gợi ý cải thiện."),
      h(
        "div",
        { className: "topicGrid" },
        ["Trả lời câu hỏi theo từng kỹ năng", "Hệ thống tự tính điểm 0-100", "Lưu kết quả vào hồ sơ", "Cập nhật gợi ý cải thiện"].map((item) => h("div", { className: "topicItem", key: item }, item))
      )
    )
  );
}

function AssessmentDashboard({ selected, onSave }) {
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(
      skills.flatMap((skill) => assessmentQuestions[skill.key].map((_, index) => [`${ skill.key } -${ index } `, null]))
    )
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({ ...current, [questionId]: Number(value) }));
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    const unanswered = Object.values(answers).filter((value) => !value).length;
    if (unanswered) {
      setMessage(`Bạn còn ${ unanswered } câu chưa trả lời.`);
      return;
    }

    const scores = Object.fromEntries(
      skills.map((skill) => {
        const values = assessmentQuestions[skill.key].map((_, index) => Number(answers[`${ skill.key } -${ index } `]));
        return [skill.key, average(values)];
      })
    );
    const evidence = skills
      .map((skill) => `${ skill.label }: ${ scores[skill.key] }/100 từ bài kiểm tra tự đánh giá`)
      .join("\n");

setIsSaving(true);
const error = await onSave({
  attendance: selected.attendance ?? 100,
  scores,
  evidence,
});
setIsSaving(false);
setMessage(error || "Đã lưu kết quả kiểm tra.");
  }

return h(
  "section",
  { className: "panel assessmentPanel" },
  h("div", { className: "panelHeader" }, h("h2", null, `Bài kiểm tra kỹ năng mềm cho ${selected.name}`), h("span", null, "Tự tính điểm 0-100")),
  h(
    "form",
    { className: "assessmentForm", onSubmit: submit },
    h(
      "section",
      { className: "quizIntro" },
      h("h3", null, "Cách chấm điểm"),
      h("p", null, "Mỗi câu hỏi là một tình huống thực tế. Bạn chọn cách xử lý phù hợp nhất; hệ thống tự tính điểm từng kỹ năng trên thang 100.")
    ),
    h(
      "div",
      { className: "questionnaire" },
      skills.map((skill) =>
        h(
          "section",
          { className: "questionBlock", key: skill.key },
          h("h3", null, skill.label),
          assessmentQuestions[skill.key].map((question, questionIndex) => {
            const questionId = `${skill.key}-${questionIndex}`;
            return h(
              "fieldset",
              { className: "questionItem", key: questionId },
              h("legend", null, question.prompt),
              h(
                "div",
                { className: "scenarioOptions" },
                question.options.map((option, optionIndex) =>
                  h(
                    "label",
                    { className: className("radioOption scenarioOption", answers[questionId] === option.score && "selected"), key: optionIndex },
                    h("input", {
                      type: "radio",
                      name: questionId,
                      value: option.score,
                      checked: answers[questionId] === option.score,
                      onChange: (event) => updateAnswer(questionId, event.target.value),
                    }),
                    h("span", null, option.text)
                  )
                )
              )
            );
          })
        )
      )
    ),
    message && h("p", { className: message.startsWith("Đã") ? "formSuccess" : "formError" }, message),
    h("button", { className: "submitButton", type: "submit", disabled: isSaving }, isSaving ? "Đang lưu..." : "Tính điểm và lưu kết quả")
  )
);
}

function ProfilePanel({ selected, analysis }) {
  return h(
    "section",
    { className: "panel profilePanel" },
    h("div", { className: "avatar" }, selected.name.split(" ").slice(-1)[0][0]),
    h("div", null, h("h2", null, selected.name), h("p", null, `${selected.major} • ${selected.year}`)),
    h(
      "div",
      { className: "metricRow" },
      h(Metric, { label: "Điểm tổng", value: analysis.overall, suffix: "/100" }),
      h(Metric, { label: "Chuyên cần", value: selected.attendance, suffix: "%" }),
      h(Metric, { label: "Xu hướng", value: selected.trend > 0 ? `+${selected.trend}` : selected.trend, suffix: " điểm" })
    ),
    h("div", { className: "statusPill" }, analysis.readiness)
  );
}

function Metric({ label, value, suffix }) {
  return h("div", { className: "metric" }, h("span", null, label), h("strong", null, value, h("small", null, suffix)));
}

function RadarPanel({ rows }) {
  return h(
    "section",
    { className: "panel chartPanel" },
    h("div", { className: "panelHeader" }, h("h2", null, "Bản đồ năng lực"), h("span", null, "So với mục tiêu")),
    h(RadarChart, { rows })
  );
}

function RadarChart({ rows }) {
  const center = 140;
  const radius = 96;
  const points = rows.map((row, index) => {
    const angle = (Math.PI * 2 * index) / rows.length - Math.PI / 2;
    const valueRadius = (row.score / 100) * radius;
    return {
      axis: `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`,
      value: `${center + Math.cos(angle) * valueRadius},${center + Math.sin(angle) * valueRadius}`,
      labelX: center + Math.cos(angle) * (radius + 28),
      labelY: center + Math.sin(angle) * (radius + 28),
      label: row.label,
    };
  });

  return h(
    "svg",
    { className: "radar", viewBox: "0 0 280 280", role: "img", "aria-label": "Biểu đồ radar kỹ năng mềm" },
    [25, 50, 75, 100].map((level) =>
      h("circle", { key: level, cx: center, cy: center, r: (level / 100) * radius, className: "radarRing" })
    ),
    points.map((point) => h("line", { key: point.axis, x1: center, y1: center, x2: point.axis.split(",")[0], y2: point.axis.split(",")[1], className: "radarAxis" })),
    h("polygon", { points: points.map((point) => point.value).join(" "), className: "radarShape" }),
    points.map((point) => h("text", { key: point.label, x: point.labelX, y: point.labelY, className: "radarLabel", textAnchor: "middle" }, point.label))
  );
}

function ScorePanel({ rows }) {
  return h(
    "section",
    { className: "panel widePanel" },
    h("div", { className: "panelHeader" }, h("h2", null, "Điểm theo kỹ năng"), h("span", null, "Mục tiêu cá nhân")),
    h(
      "div",
      { className: "bars" },
      rows.map((row) =>
        h(
          "div",
          { className: "barRow", key: row.key },
          h("div", { className: "barLabel" }, h("span", null, row.label), h("strong", null, row.score)),
          h("div", { className: "barTrack" }, h("div", { className: "barFill", style: { width: `${row.score}%` } }), h("i", { style: { left: `${row.target}%` } })),
          h("small", { className: row.gap > 0 ? "gapText" : "okText" }, row.gap > 0 ? `Thiếu ${row.gap} điểm` : "Đạt mục tiêu")
        )
      )
    )
  );
}

function RecommendationPanel({ weakest }) {
  return h(
    "section",
    { className: "panel recommendations" },
    h("div", { className: "panelHeader" }, h("h2", null, "Gợi ý cải thiện"), h("span", null, "Ưu tiên 3 kỹ năng")),
    weakest.map((skill, index) => {
      const suggestion = suggestionBank[skill.key];
      return h(
        "article",
        { className: "recommendation", key: skill.key },
        h("div", { className: "rank" }, index + 1),
        h("div", null, h("h3", null, suggestion.title), h("p", null, suggestion.action), h("small", null, suggestion.resource))
      );
    })
  );
}

function EvidencePanel({ evidence }) {
  return h(
    "section",
    { className: "panel evidencePanel" },
    h("div", { className: "panelHeader" }, h("h2", null, "Dữ liệu đầu vào"), h("span", null, "Có thể mở rộng")),
    h("ul", null, evidence.map((item) => h("li", { key: item }, item))),
    h("p", { className: "note" }, "Nguồn dữ liệu nên gồm: tự đánh giá, đánh giá giảng viên, phản hồi đồng đội, điểm rubric thuyết trình, mức độ tham gia và lịch sử hoàn thành nhiệm vụ.")
  );
}

function CohortDashboard({ cohort }) {
  return h(
    "div",
    { className: "dashboardGrid" },
    h(
      "section",
      { className: "panel cohortSummary" },
      h("h2", null, "Toàn lớp"),
      h("div", { className: "metricRow" }, h(Metric, { label: "Điểm TB", value: cohort.overall, suffix: "/100" }), h(Metric, { label: "Cần hỗ trợ", value: cohort.atRisk, suffix: " SV" }), h(Metric, { label: "Quy mô mẫu", value: students.length, suffix: " SV" }))
    ),
    h(ScorePanel, { rows: cohort.rows }),
    h(
      "section",
      { className: "panel widePanel" },
      h("div", { className: "panelHeader" }, h("h2", null, "Hướng phát triển chủ đề"), h("span", null, "Phạm vi đồ án")),
      h(
        "div",
        { className: "topicGrid" },
        ["Thu thập dữ liệu bằng biểu mẫu tự đánh giá và rubric", "Chuẩn hoá điểm theo thang 100 và mục tiêu từng kỹ năng", "Trực quan hoá xu hướng cá nhân, lớp, nhóm ngành", "Gợi ý hoạt động học tập theo khoảng cách kỹ năng", "Theo dõi tiến độ sau từng tuần hoặc từng dự án", "Cảnh báo sớm sinh viên cần cố vấn"].map((item) => h("div", { className: "topicItem", key: item }, item))
      )
    )
  );
}

function PlanDashboard({ selected, analysis }) {
  if (!analysis) {
    return h(
      "section",
      { className: "panel planPanel emptyState" },
      h("h2", null, `Chưa thể tạo kế hoạch cho ${selected.name}`),
      h("p", null, "Cần có điểm kỹ năng ban đầu để xác định khoảng cách so với mục tiêu và sinh gợi ý cải thiện phù hợp.")
    );
  }

  return h(
    "section",
    { className: "panel planPanel" },
    h("div", { className: "panelHeader" }, h("h2", null, `Kế hoạch 4 tuần cho ${selected.name}`), h("span", null, "Sinh tự động từ điểm yếu")),
    h(
      "div",
      { className: "timeline" },
      analysis.weakest.map((skill, index) => {
        const suggestion = suggestionBank[skill.key];
        return h(
          "article",
          { className: "timelineItem", key: skill.key },
          h("div", { className: "week" }, `Tuần ${index + 1}`),
          h("div", null, h("h3", null, skill.label), h("p", null, suggestion.action), h("small", null, `Đo lại bằng rubric, phản hồi đồng đội và nhật ký học tập. Mục tiêu tăng ${Math.min(skill.gap, 8)} điểm.`))
        );
      }),
      h(
        "article",
        { className: "timelineItem" },
        h("div", { className: "week" }, "Tuần 4"),
        h("div", null, h("h3", null, "Đánh giá lại"), h("p", null, "Tổng hợp minh chứng, so sánh điểm trước sau và đề xuất vòng cải thiện tiếp theo."), h("small", null, "Nên dùng biểu đồ xu hướng nếu có dữ liệu nhiều kỳ."))
      )
    )
  );
}

createRoot(document.getElementById("root")).render(h(App));
