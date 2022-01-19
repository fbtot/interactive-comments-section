async function getJSONComments() {
  const response = await fetch('./data.json');
  const jsonResponse = response.json();
  return jsonResponse;
}

function addJSONtoLocalStorage() {
  getJSONComments().then((comments) => localStorage.setItem('fmComments', JSON.stringify(comments)));
}

addJSONtoLocalStorage();
