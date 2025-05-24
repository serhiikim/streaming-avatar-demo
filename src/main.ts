import { NavigationService, type Route } from "./services/NavigationService";
import { AssistantService } from "./services/AssistantService";
import { AvatarService } from "./services/AvatarService";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";
import { AvatarPage } from "./pages/AvatarPage";
import { SettingsPage } from "./pages/SettingsPage";

class App {
  private navigationService: NavigationService;
  
  // Page instances
  private homePage: HomePage;
  private chatPage: ChatPage;
  private avatarPage: AvatarPage;
  private settingsPage: SettingsPage;
  
  private currentPage: any = null;

  constructor() {
    // Initialize services
    this.navigationService = NavigationService.getInstance();
    
    // Initialize other services (they're singletons, pages will use them)
    AssistantService.getInstance();
    AvatarService.getInstance();
    
    // Create page instances
    this.homePage = new HomePage();
    this.chatPage = new ChatPage();
    this.avatarPage = new AvatarPage();
    this.settingsPage = new SettingsPage();
    
    this.setupRouting();
    this.hideOriginalContainer();
  }

  private setupRouting(): void {
    // Set route handler
    this.navigationService.setRouteHandler(async (route: Route) => {
      await this.handleRouteChange(route);
    });

    // Set navigation callback for cleanup/preparation
    this.navigationService.setNavigationCallback((route: Route, previousRoute: Route) => {
      console.log(`Navigation: ${previousRoute} → ${route}`);
    });
  }

  private async handleRouteChange(route: Route): Promise<void> {
    try {
      // Hide current page
      if (this.currentPage) {
        this.currentPage.hide();
      }

      // Handle route-specific logic
      switch (route) {
        case 'home':
          this.currentPage = this.homePage;
          this.homePage.show();
          break;

        case 'chat':
          this.currentPage = this.chatPage;
          await this.chatPage.initialize();
          this.chatPage.show();
          break;

        case 'avatar':
          this.currentPage = this.avatarPage;
          await this.avatarPage.initialize();
          this.avatarPage.show();
          break;

        case 'settings':
          this.currentPage = this.settingsPage;
          await this.settingsPage.initialize();
          this.settingsPage.show();
          break;

        default:
          console.warn(`Unknown route: ${route}`);
          this.navigationService.navigateTo('home');
      }

    } catch (error) {
      console.error(`Error handling route ${route}:`, error);
      this.showGlobalError(`Failed to load ${route} page`);
    }
  }

  private hideOriginalContainer(): void {
    // Hide the original container from index.html
    const originalContainer = document.querySelector('.container') as HTMLElement;
    if (originalContainer) {
      originalContainer.style.display = 'none';
    }
  }

  private showGlobalError(message: string): void {
    // Simple global error handling - you can enhance this
    console.error('Global Error:', message);
    alert(`Error: ${message}`);
    
    // Fallback to home page
    this.navigationService.navigateTo('home');
  }

  // Public method to start the application
  start(): void {
    console.log('🚀 Interactive Avatar Demo starting...');
    
    // Start navigation service (this will trigger initial route)
    this.navigationService.start();
    
    console.log('✅ Application started successfully');
  }

  // Cleanup method (if needed for hot reload during development)
  destroy(): void {
    this.homePage.destroy();
    this.chatPage.destroy();
    this.avatarPage.destroy();
    this.settingsPage.destroy();
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global JavaScript Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Initialize and start the application
const app = new App();
app.start();

// Expose app to window for debugging (optional)
(window as any).app = app;