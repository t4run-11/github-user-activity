export function isValidUsername(username) {
  return (
    typeof username === "string" &&
    username.length >= 1 &&
    username.length <= 39 &&
    /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(username)
  );
}
