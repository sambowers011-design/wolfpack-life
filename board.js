const session = getSession();

if (!session) {
  window.location.href = 'account.html?mode=signin';
} else {
  const greeting = document.getElementById('greeting');
  const guestNotice = document.getElementById('guestNotice');
  greeting.textContent = session.guest ? "Hey, guest." : `Hey, ${session.name.split(' ')[0]}.`;
  guestNotice.hidden = !session.guest;
}

document.getElementById('signOutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});
