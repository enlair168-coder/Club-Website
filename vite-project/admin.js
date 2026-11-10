const adminApp = document.getElementById("admin-app");

adminApp.innerHTML = `
  <div class="min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-xl shadow-lg text-center">
      <h1 class="text-2xl font-bold mb-4">
        Integrity and Dignity Club
      </h1>

      <p class="text-green-600 font-semibold">
        Admin page loaded successfully!
      </p>

      <p class="mt-3 text-gray-500">
        Vite production build is working.
      </p>
    </div>
  </div>
`;

if (window.lucide) {
    window.lucide.createIcons();
}