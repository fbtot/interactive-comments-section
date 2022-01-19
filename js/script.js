async function getJSONComments() {
  const response = await fetch('./data.json');
  const jsonResponse = response.json();
  return jsonResponse;
}

const localStorageCommentsName = 'fmComments';
// const localStorageCurrentUser = jsonLocalStorage.currentUser;
let jsonLocalStorage;
// const localStorageComments = jsonLocalStorage.comments;

function addJSONtoLocalStorage() {
  getJSONComments()
    .then((comments) => localStorage.setItem(localStorageCommentsName, JSON.stringify(comments)));
}

if (!localStorage.localStorageCommentsName) {
  addJSONtoLocalStorage();
  jsonLocalStorage = JSON.parse(localStorage[localStorageCommentsName]);
}

const newID = () => `comment-${uuidv4().substring(0, 8)}`;

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 4 * week;
const year = 12 * month;

const now = () => new Date().getTime();

function rawGap(then) {
  return then - now();
}

// console.log(rawGap(jsonLocalStorage.comments[0].createdAt));

// ? Tooltip to display the full date.

function createdAt(creationDate) {
  const formattedGap = new Intl.RelativeTimeFormat('en');
  let relativeDate = '';

  switch (true) {
    // The minus in front of the time is essential because the gap is negative
    case rawGap(creationDate) > -minute:
      console.log('A few seconds ago.');
      break;
    case rawGap(creationDate) > -hour:
      console.log('A few minutes ago.');
      break;
    case rawGap(creationDate) > -day:
      console.log('A few hours ago.');
      break;
    case rawGap(creationDate) > -week:
      console.log('A few days ago.');
      break;
    case rawGap(creationDate) > -month:
      console.log('A few weeks ago.');
      break;
    case rawGap(creationDate) > -year:
      relativeDate = formattedGap.format(Math.floor(rawGap(creationDate) / month), 'months');
      break;
    case rawGap(creationDate) >= year:
      console.log('More than a year ago');
      break;
    default:
      console.log('A while ago');
  }
  return relativeDate;
}

console.log(createdAt(jsonLocalStorage.comments[0].createdAt));
