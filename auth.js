class Auth {
  //calls once from app.js
  init(setFn) {
    this.setAllowedIn = setFn;
  }

  //calls from a screen to change state in app
  setAllowedIn(tf) {
    this.setAllowedIn(tf);
  }
}

export default new Auth();
