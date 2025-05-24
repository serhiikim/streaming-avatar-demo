import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType
} from "@heygen/streaming-avatar";

export type AvatarStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

export interface AvatarStatusCallback {
  (status: AvatarStatus, message: string): void;
}

export class AvatarService {
  private static instance: AvatarService;
  private avatar: StreamingAvatar | null = null;
  private sessionData: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private statusCallback: AvatarStatusCallback | null = null;

  private constructor() {}

  static getInstance(): AvatarService {
    if (!AvatarService.instance) {
      AvatarService.instance = new AvatarService();
    }
    return AvatarService.instance;
  }

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    try {
      this.updateStatus('connecting', 'Connecting to avatar...');
      
      const token = await this.fetchAccessToken();
      this.avatar = new StreamingAvatar({ token });
      
      // Setup event listeners
      this.avatar.on(StreamingEvents.STREAM_READY, this.handleStreamReady.bind(this));
      this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, this.handleStreamDisconnected.bind(this));
      
      // Create avatar session
      this.sessionData = await this.avatar.createStartAvatar({
        quality: AvatarQuality.Medium,
        avatarName: "Wayne_20240711",
        language: "English",
      });

      this.updateStatus('connected', 'Connected');
      console.log('AvatarService initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize AvatarService:', error);
      this.updateStatus('error', 'Connection failed');
      throw new Error('Avatar initialization failed');
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.avatar) {
      throw new Error('Avatar not initialized');
    }

    try {
      await this.avatar.speak({
        text,
        taskType: TaskType.REPEAT,
      });
    } catch (error) {
      console.error('Failed to make avatar speak:', error);
      throw new Error('Avatar speech failed');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.avatar || !this.sessionData) {
      return;
    }

    try {
      this.updateStatus('disconnecting', 'Disconnecting...');
      
      await this.avatar.stopAvatar();
      
      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }
      
      this.avatar = null;
      this.sessionData = null;
      
      this.updateStatus('disconnected', 'Disconnected');
      console.log('Avatar disconnected successfully');
      
    } catch (error) {
      console.error('Failed to disconnect avatar:', error);
      this.updateStatus('error', 'Disconnect failed');
      throw new Error('Avatar disconnect failed');
    }
  }

  isConnected(): boolean {
    return this.avatar !== null && this.sessionData !== null;
  }

  setStatusCallback(callback: AvatarStatusCallback): void {
    this.statusCallback = callback;
  }

  private async fetchAccessToken(): Promise<string> {
    const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;
    const response = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: { "x-api-key": apiKey },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch HeyGen access token');
    }

    const { data } = await response.json();
    return data.token;
  }

  private handleStreamReady(event: any): void {
    if (event.detail && this.videoElement) {
      this.videoElement.srcObject = event.detail;
      this.videoElement.onloadedmetadata = () => {
        this.videoElement?.play().catch(console.error);
      };
    }
  }

  private handleStreamDisconnected(): void {
    console.log('Avatar stream disconnected');
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    this.updateStatus('disconnected', 'Stream disconnected');
  }

  private updateStatus(status: AvatarStatus, message: string): void {
    if (this.statusCallback) {
      this.statusCallback(status, message);
    }
  }
}