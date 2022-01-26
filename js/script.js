const commentsContainer = document.getElementById('commentsContainer');
const deleteMessage = 'This comment has been deleted by the author.';
const replyForms = document.getElementsByClassName('form');
const upvoteLink = document.getElementsByClassName('counter__plus');
const downvoteLink = document.getElementsByClassName('counter__minus');
const deleteBtn = document.getElementsByClassName('comment__delete');
const editBtn = document.getElementsByClassName('comment__edit');
const replyBtn = document.getElementsByClassName('comment__reply');
const suffixPointsID = '-points';
const now = () => new Date().getTime();

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 4 * week;
const year = 12 * month;
let localStorageCurrentUser = {};
let localStorageComments = {};

async function getJSONComments() {
  const response = await fetch('./data.json');
  const jsonResponse = response.json();
  return jsonResponse;
}

const localStorageCommentsName = 'fmComments';
let jsonFromLocalStorage;

function addJSONtoLocalStorage() {
  getJSONComments()
    .then((comments) => {
      localStorage.setItem(localStorageCommentsName, JSON.stringify(comments));
      jsonFromLocalStorage = JSON.parse(localStorage[localStorageCommentsName]);
      localStorageCurrentUser = jsonFromLocalStorage.currentUser;
      localStorageComments = jsonFromLocalStorage.comments;
      displayComments();
      commentPoints();
      deleteComment();
      editComment();
      reply();
    });
}

if (!localStorage.getItem(localStorageCommentsName)) {
  addJSONtoLocalStorage();
} else {
  jsonFromLocalStorage = JSON.parse(localStorage[localStorageCommentsName]);
  localStorageCurrentUser = jsonFromLocalStorage.currentUser;
  localStorageComments = jsonFromLocalStorage.comments;
  displayComments();
  commentPoints();
  deleteComment();
  editComment();
  reply();
}

function updateLocalStorage() {
  localStorage.setItem(localStorageCommentsName, JSON.stringify(jsonFromLocalStorage));
}

function thisComment(el) {
  return el.closest('.comment-container');
}
function thisCommentID(el) {
  return thisComment(el).getAttribute('data-id');
}

function findComment(id) {
  let foundComment = {};
  localStorageComments.forEach((comm) => {
    if (comm.id === id) foundComment = comm;
    else {
      comm.replies.forEach((currentReply) => {
        if (currentReply.id === id) foundComment = currentReply;
      });
    }
  });
  return foundComment;
}

/* ============================================ */
/* ··········································· §  ··· */
/* ======================================== */
function displayComments() {
  commentsContainer.innerHTML = localStorageComments
    .sort((comment1, comment2) => comment2.score - comment1.score)
    .map((el) => {
      if (el.replies.length > 0) {
        return `${createComment(el)} ${createReplies(el)}`;
      }
      return createComment(el);
    })
    .join('');
}

function createComment(index) {
  function checkCurrentUser() {
    return index.user.username === localStorageCurrentUser.username;
  }

  function checkDeleted() {
    return index.deleted;
  }

  const commentID = index.id;
  const commentHTML = `<div id="${commentID}" data-id="${commentID}" data-replying-to="${index.replyingTo ? index.replyingTo : ''}" class="comment-container basic-container ${deletedCommentClass(checkDeleted())} ${currentUserClass(checkCurrentUser())}">
              <div class="comment__meta">
                <img src="${index.user.image.png}" alt="${index.user.username} avatar" class="comment__avatar" />
                <a href="#" class="comment__author"><b>${index.user.username}</b></a>
                <span class="comment__current-user-tag tag tag--blue">you</span>
              <span class="comment__date">${createdAt(index.createdAt)}</span>
              </div>
            <div class="comment__comment" id="${commentID}-comment">${processText(index.content)}</div>
            <div class="counter-container comment__counter-container">
              <div class="comment__points counter">
                <a href="#" id="${commentID}-upvote" aria-label="upvote" class="counter__plus comment__points__upvote ${votedClass(commentID, 'upvote')}"><i class="bx bx-plus"></i></a>
                <span id="${commentID}${suffixPointsID}" class="comment__points__count counter__count">${index.score}</span>
                <a href="#" id="${commentID}-downvote" aria-label="downvote" class="counter__minus comment__points__downvote ${votedClass(commentID, 'downvote')} "><i class="bx bx-minus"></i></a>
              </div>
              </div>
            <div class="comment__action">
            ${commentActions(checkCurrentUser())}
            </div>
          </div>`;

  const deletedCommentHTML = `<div id="${commentID}" data-id="${commentID}" data-replying-to="${index.replyingTo ? index.replyingTo : ''}" class="comment-container basic-container comment-deleted">
  <p class="comment__deleted-message" >${deleteMessage}</p>
          </div>`;

  return checkDeleted() ? deletedCommentHTML : commentHTML;
}

function currentUserClass(currentUser) {
  let className = '';
  if (currentUser) {
    className = ' current-user ';
  }
  return className;
}

function deletedCommentClass(currentUser) {
  let className = '';
  if (currentUser) {
    className = ' comment-deleted ';
  }
  return className;
}

// eslint-disable-next-line consistent-return
function votedClass(id, kindOfVote) {
  if (localStorageCurrentUser.votes && localStorageCurrentUser.votes[id] === kindOfVote) {
    return 'voted';
  }
}

function createReplies(parentComment) {
  return `<div class="replies-container" id="${parentComment.id}-replies-container" data-id-parent="${parentComment.id}">
    ${parentComment.replies
    .sort((reply1, reply2) => reply1.createdAt - reply2.createdAt)
    .map((currentReply) => createComment(currentReply)).join('')}
    </div>`;
}

function commentActions(currentUser) {
  const replyLink = '<a href="#" class="icon-text comment__reply"><i class="icon-text__icon bx bxs-share"></i><span>Reply</span></a>';
  const editLink = '<a href="#" class="icon-text comment__edit"><i class="icon-text__icon bx bxs-pencil"></i><span>Edit</span></a>';
  const deleteLink = '<a href="#" class="icon-text comment__delete"><i class="icon-text__icon bx bxs-trash-alt"></i><span>Delete</span></a>';
  if (currentUser) {
    return `${editLink}
                ${deleteLink}`;
  }
  return `${replyLink}`;
}

function commentPoints() {
  Array.from(upvoteLink).forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const commentID = thisCommentID(link);

      if (findComment(commentID).user.username !== localStorageCurrentUser.username) {
        if (checkUserVoted(commentID, 'downvote')) {
          editPointsInJSON(commentID, 2);
          addVoteToUser(commentID, 'upvote');
          addVotedClass(commentID, 'upvote');
        } else if (checkUserVoted(commentID, 'upvote')) {
          editPointsInJSON(commentID, -1);
          removeVotedClass(commentID, 'upvote');
          removeVotefromUser(commentID);
        } else {
          editPointsInJSON(commentID, 1);
          addVoteToUser(commentID, 'upvote');
          addVotedClass(commentID, 'upvote');
        }
        updateScoreDOM(commentID);
        updateLocalStorage();
      }
    });
  });

  Array.from(downvoteLink).forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const commentID = thisCommentID(link);

      if (findComment(commentID).user.username !== localStorageCurrentUser.username) {
        if (checkUserVoted(commentID, 'upvote')) {
          editPointsInJSON(commentID, -2);
          addVoteToUser(commentID, 'downvote');
          addVotedClass(commentID, 'downvote');
        } else if (checkUserVoted(commentID, 'downvote')) {
          editPointsInJSON(commentID, 1);
          removeVotedClass(commentID, 'downvote');
          removeVotefromUser(commentID);
        } else {
          editPointsInJSON(commentID, -1);
          addVoteToUser(commentID, 'downvote');
          addVotedClass(commentID, 'downvote');
        }
        updateScoreDOM(commentID);
        updateLocalStorage();
      }
    });
  });
}

function editPointsInJSON(id, points = 1) {
  findComment(id).score += points;
}

function updateScoreDOM(id) {
  document.getElementById(`${id}-points`).innerText = findComment(id).score;
}

function addVoteToUser(id, vote) {
  if (!localStorageCurrentUser.votes) {
    localStorageCurrentUser.votes = {};
  }
  localStorageCurrentUser.votes[id] = vote;
}

function removeVotefromUser(id) {
  delete localStorageCurrentUser.votes[id];
}

// eslint-disable-next-line consistent-return
function checkUserVoted(id, kindOfVote) {
  if (localStorageCurrentUser.votes) {
    return localStorageCurrentUser.votes[id] === kindOfVote;
  }
}

function addVotedClass(id, kindOfVote) {
  document.getElementById(`${id}-upvote`).classList.remove('voted');
  document.getElementById(`${id}-downvote`).classList.remove('voted');
  document.getElementById(`${id}-${kindOfVote}`).classList.add('voted');
}

function removeVotedClass(id, kindOfVote) {
  document.getElementById(`${id}-${kindOfVote}`).classList.remove('voted');
}

function newID() {
  return `comment-${uuidv4().substring(0, 8)}`;
}

function rawGap(then) {
  return then - now();
}

// TODO: Tooltip to display the full date.

function createdAt(creationDate) {
  const formattedGap = new Intl.RelativeTimeFormat('en');
  let relativeDate = '';

  switch (true) {
    // The minus in front of the time variable is essential because the gap is negative
    case rawGap(creationDate) > -minute:
      relativeDate = 'A few seconds ago';
      break;
    case rawGap(creationDate) > -hour:
      relativeDate = formattedGap.format(Math.floor(rawGap(creationDate) / minute), 'minutes');
      break;
    case rawGap(creationDate) > -day:
      relativeDate = formattedGap.format(Math.floor(rawGap(creationDate) / hour), 'hours');
      break;
    case rawGap(creationDate) > -week:
      relativeDate = formattedGap.format(Math.floor(rawGap(creationDate) / day), 'days');
      break;
    case rawGap(creationDate) > -month:
      relativeDate = formattedGap.format(Math.floor(rawGap(creationDate) / week), 'weeks');
      break;
    case rawGap(creationDate) > -year:
      relativeDate = formattedGap.format(Math.floor(rawGap(creationDate) / month), 'months');
      break;
    case rawGap(creationDate) <= -year:
      relativeDate = 'More than a year ago';
      break;
    default:
      relativeDate = 'A while ago';
  }
  return relativeDate;
}

Array.from(replyForms).forEach((el) => {
  el.addEventListener('submit', (e) => {
    e.preventDefault();
    const replyElement = document.getElementById('comment-reply-text');

    addNewCommentToJSON(replyElement.value.trim());
    commentsContainer
      .innerHTML += createComment(localStorageComments[localStorageComments.length - 1]);
    const commentCreated = document.getElementById(localStorageComments.at(-1).id);

    addAnimation(commentCreated);
    updateLocalStorage();
    commentPoints();
    editComment();
    deleteComment();
    replyElement.value = '';
  });
});

function addNewCommentToJSON(content, userReply = null, idAnsweringComment = false) {
  const comment = generateNewCommentInJSON(content, userReply);
  if (idAnsweringComment) {
    findComment(idAnsweringComment).replies.push(comment);
  } else {
    localStorageComments.push(comment);
  }
}

function generateNewCommentInJSON(content, userReply = null) {
  return {
    id: newID(),
    content: content.trim(),
    createdAt: now(),
    score: 0,
    replyingTo: userReply,
    user: {
      image: {
        png: localStorageCurrentUser.image.png,
        webp: localStorageCurrentUser.image.webp,
      },
      username: localStorageCurrentUser.username,
    },
    replies: [],
  };
}

function addMentionsToText(text) {
  const regex = /(?<=\s)@[^0-9\s]+/gmi; // matches everything except number and spaces
  return text.replaceAll(regex, `<a class="comment__user-mention" href="#">${'$&'}</a>`);
}

function preventHTMLInjection(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function processText(text) {
  let result = text;
  result = preventHTMLInjection(result);
  result = addMentionsToText(result);
  return result;
}

function deleteComment() {
  Array.from(deleteBtn).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      swal('Delete Comment', 'Are you sure you want to delete this comment? This will remove the comment and can\'t be undine.', {
        dangerMode: true,
        buttons: ['No, cancel', 'Yes, delete'],
      }).then((willDelete) => {
        if (willDelete) deleteAction(btn);
      });
    });
  });
}

function deleteAction(el) {
  const id = thisCommentID(el);
  const comment = findComment(id);
  comment.content = deleteMessage;
  comment.deleted = true;
  thisComment(el).classList.add('comment-deleted');
  document.getElementById(id).classList.add('comment-deleted');
  document.getElementById(id).innerHTML = `<p class="comment__deleted-message">${deleteMessage}</p>`;
  updateLocalStorage();
}

function editComment() {
  Array.from(editBtn).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = thisCommentID(btn);
      const comment = thisComment(btn);
      comment.classList.add('edit-comment');
      insertEdit(id);
      cancelEdit(id);
    });
  });
}

function createEdit(id) {
  return `<form method="get" id="${id}-edit-form" class="form comment__edit-comment">
  <textarea id="${id}-comment-edit" validate placeholder="Write your reply..."> </textarea>
  <div class="comment__edit-buttons">
    <button id="${id}-cancel" class="comment__edit-cancel red-button">Cancel</button>
    <button id="${id}-update" class="comment__edit-update blue-button">Update</button>
  </div>
</form>`;
}

function insertEdit(id) {
  const commentContent = document.getElementById(`${id}-comment`);
  commentContent.insertAdjacentHTML('afterend', createEdit(id));
  const textarea = document.getElementById(`${id}-comment-edit`);
  textarea.innerText = commentContent.innerText;
  textarea.focus();
}

function cancelEdit(id) {
  const cancelBtn = document.getElementById(`${id}-cancel`);
  const updateBtn = document.getElementById(`${id}-update`);
  const comment = document.getElementById(id);
  const editForm = document.getElementById(`${id}-edit-form`);

  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    comment.classList.remove('edit-comment');
    // TODO: aggiungere modal
    editForm.remove();
  });

  updateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    updateComment(id);
    comment.classList.remove('edit-comment');
    editForm.remove();
    updateLocalStorage();
  });
}
function updateComment(id) {
  const commentContent = document.getElementById(`${id}-comment`);
  const editContent = document.getElementById(`${id}-comment-edit`);
  findComment(id).content = editContent.value;
  commentContent.innerHTML = processText(editContent.value);
}

function reply() {
  Array.from(replyBtn).forEach((btn) => {
    btn.addEventListener('click', (clickReplyEvent) => {
      clickReplyEvent.preventDefault();
      const comment = thisComment(btn);
      const { id } = comment;

      toggleReplyContainer(id, comment);
      const textarea = document.getElementById(`${id}-reply-edit`);
      const replyForm = document.getElementById(`${id}-reply-form`);

      textarea.focus();

      if (replyForm) {
        replyForm.addEventListener('submit', (submitEvent) => {
          submitEvent.preventDefault();
          toggleRepliesContainer(id, comment);
          sendReply(id);
          document.getElementById(`${id}-reply-container`).remove();
          updateLocalStorage();
          editComment();
          deleteComment();
        });
      }
    });
  });
}

function toggleReplyContainer(id, comment) {
  if (!checkElementbyID(`${id}-reply-container`)) {
    comment.insertAdjacentHTML('afterend', createReply(id));
  } else {
    document.getElementById(`${id}-reply-container`).remove();
  }
}

function sendReply(id) {
  const idParent = retrieveIDParent(id);
  const repliesContainer = document.getElementById(`${idParent}-replies-container`);
  const replyTextarea = document.getElementById(`${id}-reply-edit`);
  const replyContent = replyTextarea.value;
  const commentReplies = findComment(idParent).replies;

  commentReplies.push(generateNewCommentInJSON(replyContent, findComment(id).user.username));
  repliesContainer.insertAdjacentHTML('beforeend', createComment(commentReplies.at(-1)));
  const createdCommentID = commentReplies.at(-1).id;
  const createdComment = document.getElementById(createdCommentID);
  addAnimation(createdComment);
  scrollIntoView(createdComment);

  // TODO: Spostare in repoy
}

function retrieveIDParent(id) {
  const element = document.getElementById(id);
  if (findComment(id).replyingTo !== undefined) {
    return element.closest('.replies-container').getAttribute('data-id-parent');
  }
  return id;
}

function checkElementbyID(id) {
  return !!document.getElementById(id);
}

function checkIsReply(id) {
  const element = document.getElementById(id);
  return !!thisComment(element).getAttribute('data-replying-to');
}

function toggleRepliesContainer(id, comment) {
  const element = document.getElementById(`${id}-replies-container`);
  if (!element && !checkIsReply(id)) {
    comment.insertAdjacentHTML('afterEnd', createRepliesContainer(id));
  }
  if (element && element.childNodes.length === 0) {
    removeRepliesContainer(id);
  }
}

function createRepliesContainer(id) {
  return `<div class="replies-container" id="${id}-replies-container" data-id-parent="${id}"><p>REplies Container</p></div>`;
}

function removeRepliesContainer(id) {
  document.getElementById(`${id}-replies-container`).remove();
}

function createReply(id) {
  return `
          <div id="${id}-reply-container" class="reply-container basic-container">
            <form action="get" class="reply form" id="${id}-reply-form">
              <textarea required placeholder="Add a reply…" name="Comment-reply" id="${id}-reply-edit" class="reply__text"></textarea>
              <img src="./images/avatars/image-juliusomo.png" alt="juliusomo avatar" class="reply__avatar" />
              <div class="reply__button-container">
                <button id="${id}-send-reply" class="reply__button blue-button">Send</button>
              </div>
            </form>
            </div>
  `;
}

function addAnimation(el, animationName = 'animate__bounce') {
  el.classList.add('animate__animated', animationName);
  setTimeout(() => el.classList.remove('animate__animated', animationName), 1000);
}

function scrollIntoView(el) {
  if (el.getBoundingClientRect().bottom > window.innerHeight) {
    el.scrollIntoView({ block: 'end' });
  }
}
