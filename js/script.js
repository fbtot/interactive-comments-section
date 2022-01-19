async function getJSONComments() {
  const response = await fetch('./data.json');
  const jsonResponse = response.json();
  return jsonResponse;
}

const localStorageCommentsName = 'fmComments';
const jsonLocalStorage = JSON.parse(localStorage[localStorageCommentsName]);
// const localStorageCurrentUser = jsonLocalStorage.currentUser;
// const localStorageComments = jsonLocalStorage.comments;

function addJSONtoLocalStorage() {
  getJSONComments()
    .then((comments) => localStorage.setItem(localStorageCommentsName, JSON.stringify(comments)));
}

if (!localStorage.localStorageCommentsName) {
  addJSONtoLocalStorage();
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
