// Burger menu functionality for DaChat application

document.addEventListener("DOMContentLoaded", () => {
  const burgerButton = document.querySelector(".burger-button");
  const closeButton = document.querySelector(".close-button");
  const sidebar = document.querySelector("aside");

  if (!burgerButton) console.error("Burger button not found!");
  if (!closeButton) console.error("Close button not found!");
  if (!sidebar) console.error("Sidebar element not found!");

  burgerButton.addEventListener("click", () => {
    console.log("Burger button clicked");
    console.log("Current sidebar classes:", sidebar.className);

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Mobile behavior
      const isHidden = sidebar.classList.contains("hidden");

      // Toggle mobile menu state
      if (isHidden) {
        // Show mobile menu
        sidebar.classList.remove("hidden");
        sidebar.classList.add("sidebar-mobile", "fixed", "inset-0", "z-10");
      } else {
        // Hide mobile menu
        sidebar.classList.add("hidden");
        setTimeout(() => {
          sidebar.classList.remove(
            "sidebar-mobile",
            "fixed",
            "inset-0",
            "z-10"
          );
        }, 300); // Match CSS transition duration
      }
    } else {
      // Desktop behavior - ensure consistent state
      sidebar.classList.remove(
        "hidden",
        "fixed",
        "inset-0",
        "z-10",
        "sidebar-mobile"
      );
      sidebar.classList.add("md:block");
    }

    console.log("Updated sidebar classes:", sidebar.className);
  });

  // Close button functionality
  closeButton.addEventListener("click", () => {
    console.log("Close button clicked");

    if (window.innerWidth < 768) {
      // Hide mobile menu
      sidebar.classList.add("hidden");
      setTimeout(() => {
        sidebar.classList.remove("sidebar-mobile", "fixed", "inset-0", "z-10");
      }, 300); // Match CSS transition duration
    }
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth < 768 &&
      !sidebar.classList.contains("hidden") &&
      !e.target.closest("aside") &&
      !e.target.closest(".burger-button")
    ) {
      sidebar.classList.add("hidden");
      sidebar.classList.remove("fixed", "inset-0", "z-10", "sidebar-mobile");
    }
  });
});
