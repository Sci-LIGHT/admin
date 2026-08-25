const SUPABASE_URL = "https://qhdzejpfruuytmvbyqkf.supabase.co";
const SUPABASE_KEY = "sb_publishable_QXSTNqbIf85PrPR1V6r5pA_fczvFUrq";

window.supabaseClient =
  window.supabaseClient ||
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const supabaseClient = window.supabaseClient;


/* =========================
   ELEMENTS: LOGIN / LAYOUT
========================= */

const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

const adminLayout = document.getElementById("admin-layout");
const logoutButton = document.getElementById("logout-button");
const adminEmailLabel = document.getElementById("admin-email-label");


/* =========================
   LOGIN
========================= */

loginForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  loginError.classList.add("hidden");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value,
  });

  if (error) {
    console.error("Login error:", error);
    loginError.classList.remove("hidden");
    return;
  }

  loginForm.reset();

  // onAuthStateChange (below) handles showing the panel.

});


/* =========================
   LOGOUT
========================= */

logoutButton?.addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  // onAuthStateChange (below) handles showing the login screen.

});


/* =========================
   REACT TO AUTH STATE
========================= */

supabaseClient.auth.onAuthStateChange((event, session) => {

  if (session) {

    loginScreen.classList.add("hidden");
    adminLayout.classList.remove("hidden");

    if (adminEmailLabel) {
      adminEmailLabel.textContent = session.user.email;
    }

    loadPosts();

  } else {

    adminLayout.classList.add("hidden");
    loginScreen.classList.remove("hidden");

  }

});


/* =========================
   PAGE TITLES
========================= */

const pageTitles = {
  pending: "Pending Posts",
  approved: "Approved Posts",
  rejected: "Rejected Posts"
};


/* =========================
   LOAD POSTS FROM SUPABASE
========================= */

async function loadPosts() {

  const { data, error } = await supabaseClient
    .from("freedom_wall")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Error loading posts:", error);
    return;
  }

  console.log("Posts loaded:", data);

  displayPosts(data);
}


/* =========================
   DISPLAY POSTS
========================= */

function displayPosts(posts) {

  const pendingContainer =
    document.getElementById("pending-posts");

  const approvedContainer =
    document.getElementById("approved-posts");

  const rejectedContainer =
    document.getElementById("rejected-posts");


  pendingContainer.innerHTML = "";
  approvedContainer.innerHTML = "";
  rejectedContainer.innerHTML = "";


  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;


  posts.forEach((post) => {

    const card = createPostCard(post);


    if (post.status === "pending") {

      pendingContainer.appendChild(card);
      pendingCount++;

    }

    else if (post.status === "approved") {

      approvedContainer.appendChild(card);
      approvedCount++;

    }

    else if (post.status === "rejected") {

      rejectedContainer.appendChild(card);
      rejectedCount++;

    }

  });


  document.getElementById("pending-count").textContent =
    pendingCount;

  document.getElementById("approved-count").textContent =
    approvedCount;

  document.getElementById("rejected-count").textContent =
    rejectedCount;


  if (pendingCount === 0) {

    showEmptyState(
      pendingContainer,
      "No posts are waiting for review."
    );

  }


  if (approvedCount === 0) {

    showEmptyState(
      approvedContainer,
      "No posts have been approved yet."
    );

  }


  if (rejectedCount === 0) {

    showEmptyState(
      rejectedContainer,
      "No posts have been rejected."
    );

  }

}


/* =========================
   CREATE POST CARD
========================= */

function createPostCard(post) {

  const card = document.createElement("article");

  card.className = "moderation-card";

  card.dataset.id = post.id;


  const nickname =
    post.codename?.trim() || "Anonymous";


  const avatarColor =
    post.color || "#f4d86c";


  let statusLabel = "";


  if (post.status === "pending") {

    statusLabel = `
      <span class="pending-label">
        Pending
      </span>
    `;

  }

  else if (post.status === "approved") {

    statusLabel = `
      <span class="approved-label">
        Approved
      </span>
    `;

  }

  else if (post.status === "rejected") {

    statusLabel = `
      <span class="rejected-label">
        Rejected
      </span>
    `;

  }


  let actions = "";


  if (post.status === "pending") {

    actions = `
      <div class="post-actions">

        <button
          class="reject-button"
          onclick="rejectPost(${post.id})"
        >
          Reject
        </button>

        <button
          class="approve-button"
          onclick="approvePost(${post.id})"
        >
          Approve
        </button>

      </div>
    `;

  }

  else if (post.status === "approved" || post.status === "rejected") {

    actions = `
      <div class="post-actions">

        <button
          class="delete-button"
          onclick="deletePost(${post.id})"
        >
          Remove
        </button>

      </div>
    `;

  }


  card.innerHTML = `

    <div class="post-header">

      <div class="post-identity">

        <span class="post-avatar" style="background:${avatarColor}"></span>

        <div>

          <strong>
            ${escapeHTML(nickname)}
          </strong>

          <span>
            ${formatDate(post.created_at)}
          </span>

        </div>

      </div>

      ${statusLabel}

    </div>


    <div class="post-message">

      ${escapeHTML(post.message)}

    </div>


    ${actions}

  `;


  return card;

}


/* =========================
   APPROVE POST
========================= */

async function approvePost(id) {

  const { error } = await supabaseClient
    .from("freedom_wall")
    .update({
      status: "approved"
    })
    .eq("id", id);


  if (error) {

    console.error("Error approving post:", error);

    alert(
      "Something went wrong while approving the post."
    );

    return;

  }


  console.log("Post approved:", id);

  await loadPosts();

}


/* =========================
   REJECT POST
========================= */

async function rejectPost(id) {

  const { error } = await supabaseClient
    .from("freedom_wall")
    .update({
      status: "rejected"
    })
    .eq("id", id);


  if (error) {

    console.error("Error rejecting post:", error);

    alert(
      "Something went wrong while rejecting the post."
    );

    return;

  }


  console.log("Post rejected:", id);

  await loadPosts();

}


/* =========================
   DELETE POST
   (removes an approved note
   from the board entirely)
========================= */

async function deletePost(id) {

  const confirmed = confirm(
    "Remove this note from the board? This can't be undone."
  );

  if (!confirmed) {
    return;
  }

  const { error } = await supabaseClient
    .from("freedom_wall")
    .delete()
    .eq("id", id);


  if (error) {

    console.error("Error deleting post:", error);

    alert(
      "Something went wrong while removing the post."
    );

    return;

  }


  console.log("Post deleted:", id);

  await loadPosts();

}


/* =========================
   FORMAT DATE
========================= */

function formatDate(date) {

  return new Date(date).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


/* =========================
   EMPTY STATE
========================= */

function showEmptyState(container, message) {

  const empty = document.createElement("div");

  empty.className = "empty-state";

  empty.textContent = message;

  container.appendChild(empty);

}


/* =========================
   SECTION NAVIGATION
========================= */

const navButtons =
  document.querySelectorAll(".nav-item");

const sections =
  document.querySelectorAll(".section");

const pageTitle =
  document.getElementById("page-title");


navButtons.forEach((button) => {

  button.addEventListener("click", () => {

    const sectionName =
      button.dataset.section;


    navButtons.forEach((btn) => {

      btn.classList.remove("active");

    });


    button.classList.add("active");


    sections.forEach((section) => {

      section.classList.remove(
        "active-section"
      );

    });


    const selectedSection =
      document.getElementById(
        `${sectionName}-section`
      );


    if (selectedSection) {

      selectedSection.classList.add(
        "active-section"
      );

    }


    pageTitle.textContent =
      pageTitles[sectionName];

  });

});

/*
  NOTE: loadPosts() is no longer called directly at
  the bottom of the file — onAuthStateChange (above)
  calls it once a session is confirmed, and shows the
  login screen instead if there isn't one.
*/