const commentsContainer = document.getElementById('commentsContainer');
const upvoteLink = document.getElementsByClassName('counter__plus');
const downvoteLink = document.getElementsByClassName('counter__minus');
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
  // TODO: aggiungere bold a counter__count
  return `<div id="${index.id}" data-id="${index.id}" data-replying-to="${index.replyingTo ? index.replyingTo : ''}" class="comment-container basic-container ${currentUserClass(checkCurrentUser())}">
              <div class="comment__meta">
                <img src="${index.user.image.png}" alt="${index.user.username} avatar" class="comment__avatar" />
                <a href="#" class="comment__author"><b>${index.user.username}</b></a>
                <span class="comment__current-user-tag tag tag--blue">you</span>
              <span class="comment__date">${createdAt(index.createdAt)}</span>
              </div>
            <div class="comment__comment">${index.content}</div>
            <div class="counter-container comment__counter-container">
              <div class="comment__points counter">
                <a href="#" aria-label="upvote" class="counter__plus comment__points__upvote"><i class="bx bx-plus"></i></a>
                <span id="${index.id}${suffixPointsID}" class="comment__points__count counter__count">${index.score}</span>
                <a href="#" aria-label="downvote" class="counter__minus comment__points__downvote"><i class="bx bx-minus"></i></a>
              </div>
              </div>
            <div class="comment__action">
            ${commentActions(checkCurrentUser())}
            </div>
          </div>`;
}

function currentUserClass(currentUser) {
  let className = '';
  if (currentUser) {
    className = ' current-user ';
  }
  return className;
}
function createReplies(parentComment) {
  return `<div class="replies-container" data-id-parent="${parentComment.id}">
    ${parentComment.replies
    .sort((reply1, reply2) => reply1.createdAt - reply2.createdAt)
    .map((reply) => createComment(reply)).join('')}
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

// TODO: add unclickaable links in css whan the comment is by current user
function commentPoints() {
  Array.from(upvoteLink).forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const commentID = thisCommentID(link);
      console.log(commentID);
      if (findComment(commentID).user.username !== localStorageCurrentUser.username) {
        addPointsToJSON(commentID);
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
        subtractPointsToJSON(commentID);
        updateScoreDOM(commentID);
        updateLocalStorage();
      }
    });
  });
}

// eslint-disable-next-line
// TODO: aggiungere replythread all'html con l'ID del primo commento nella gerarchia, poi usare questa proprietà per trovare l'id corretto

function subtractPointsToJSON(id) {
  findComment(id).score -= 1;
}

function addPointsToJSON(id) {
  findComment(id).score += 1;
}

function updateScoreDOM(id) {
  document.getElementById(`${id}-points`).innerText = findComment(id).score;
}

function findComment(id) {
  let foundComment = {};
  localStorageComments.find((comm) => {
    if (comm.id === id) foundComment = comm;
    else {
      comm.replies.find((reply) => {
        if (reply.id === id) foundComment = reply;
      });
    }
  });
  return foundComment;
}
// eslint-disable-next-line
function newID() {
  return `comment-${uuidv4().substring(0, 8)}`;
}

function rawGap(then) {
  return then - now();
}

// console.log(rawGap(jsonLocalStorage.comments[0].createdAt));

// TODO: Tooltip to display the full date.

function createdAt(creationDate) {
  const formattedGap = new Intl.RelativeTimeFormat('en');
  let relativeDate = '';

  switch (true) {
    // The minus in front of the time is essential because the gap is negative
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
