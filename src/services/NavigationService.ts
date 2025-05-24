export type Route = 'home' | 'chat' | 'avatar' | 'settings';

export interface RouteHandler {
  (route: Route): void | Promise<void>;
}

export interface NavigationCallback {
  (route: Route, previousRoute: Route): void;
}

export class NavigationService {
  private static instance: NavigationService;
  private currentRoute: Route = 'home';
  private routeHandler: RouteHandler | null = null;
  private navigationCallback: NavigationCallback | null = null;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  setRouteHandler(handler: RouteHandler): void {
    this.routeHandler = handler;
  }

  setNavigationCallback(callback: NavigationCallback): void {
    this.navigationCallback = callback;
  }

  async navigateTo(route: Route): Promise<void> {
    const previousRoute = this.currentRoute;
    
    // Update URL hash
    const hash = route === 'home' ? '' : `#/${route}`;
    window.location.hash = hash;
    
    // Update current route
    this.currentRoute = route;
    
    // Update page title
    this.updatePageTitle(route);
    
    // Notify callback
    if (this.navigationCallback) {
      this.navigationCallback(route, previousRoute);
    }
    
    // Execute route handler
    if (this.routeHandler) {
      await this.routeHandler(route);
    }
  }

  getCurrentRoute(): Route {
    return this.currentRoute;
  }

  // Initialize from current URL
  start(): void {
    const route = this.getRouteFromHash();
    this.navigateTo(route);
  }

  private setupEventListeners(): void {
    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', () => {
      const route = this.getRouteFromHash();
      if (route !== this.currentRoute) {
        this.navigateTo(route);
      }
    });
  }

  private getRouteFromHash(): Route {
    const hash = window.location.hash.replace('#/', '');
    
    switch (hash) {
      case 'chat':
        return 'chat';
      case 'avatar':
        return 'avatar';
      case 'settings':
        return 'settings';
      default:
        return 'home';
    }
  }

  private updatePageTitle(route: Route): void {
    const titles = {
      home: 'Interactive Avatar Demo',
      chat: 'Chat - Interactive Avatar Demo',
      avatar: 'Avatar - Interactive Avatar Demo',
      settings: 'Settings - Interactive Avatar Demo'
    };
    
    document.title = titles[route];
  }

  // Helper method to create navigation links
  createNavigationButton(route: Route, text: string, className: string = ''): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', () => {
      this.navigateTo(route);
    });
    return button;
  }

  // Update active navigation state
  updateActiveNavigation(): void {
    const navLinks = document.querySelectorAll('[data-nav-route]');
    navLinks.forEach(link => {
      const linkRoute = (link as HTMLElement).dataset.navRoute as Route;
      if (linkRoute === this.currentRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}