const commentsContainer = document.getElementById('commentsContainer');
const replyForms = document.getElementsByClassName('form');
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

function findComment(id) {
  let foundComment = {};
  localStorageComments.forEach((comm) => {
    if (comm.id === id) foundComment = comm;
    else {
      comm.replies.forEach((reply) => {
        if (reply.id === id) foundComment = reply;
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

  const commentID = index.id;
  return `<div id="${commentID}" data-id="${commentID}" data-replying-to="${index.replyingTo ? index.replyingTo : ''}" class="comment-container basic-container ${currentUserClass(checkCurrentUser())}">
              <div class="comment__meta">
                <img src="${index.user.image.png}" alt="${index.user.username} avatar" class="comment__avatar" />
                <a href="#" class="comment__author"><b>${index.user.username}</b></a>
                <span class="comment__current-user-tag tag tag--blue">you</span>
              <span class="comment__date">${createdAt(index.createdAt)}</span>
              </div>
            <div class="comment__comment">${addMentionsToText(index.content)}</div>
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
}

function currentUserClass(currentUser) {
  let className = '';
  if (currentUser) {
    className = ' current-user ';
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

// eslint-disable-next-line
function newID() {
  // eslint-disable-next-line no-undef
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
    const replyText = document.getElementById('comment-reply-text').value.trim();

    addNewCommentToJSON(replyText);
    commentsContainer
      .innerHTML += createComment(localStorageComments[localStorageComments.length - 1]);

    updateLocalStorage();
    commentPoints();
  });
});

function addNewCommentToJSON(content) {
  const comment = generateNewCommentInJSON(content);
  localStorageComments.push(comment);
}

function generateNewCommentInJSON(content) {
  return {
    id: newID(),
    content: content.trim(),
    createdAt: now(),
    score: 0,
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
