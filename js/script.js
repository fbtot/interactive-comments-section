async function getJSONComments() {
  const response = await fetch('./data.json');
  const jsonResponse = response.json();
  return jsonResponse;
}

const localStorageCommentsName = 'fmComments';

function addJSONtoLocalStorage() {
  getJSONComments()
    .then((comments) => localStorage.setItem(localStorageCommentsName, JSON.stringify(comments)));
}

if (!localStorage.localStorageCommentsName) {
  addJSONtoLocalStorage();
}
