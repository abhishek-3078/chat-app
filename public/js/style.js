const sidebar=document.querySelector("#sidebar")
const sidebarContainer=document.querySelector(".chat__sidebar")
const toggleSidebarButton = document.getElementById('toggleSidebar');
const chatContainer = document.querySelector('.chat');

toggleSidebarButton.addEventListener('click', () => {
  sidebar.classList.toggle('sidebar-visible');
  sidebarContainer.classList.toggle('active');
  toggleSidebarButton.classList.toggle('active');
});
