/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { Messaging } from '@angular/fire/messaging';
import * as messagingModule from '@angular/fire/messaging';

import { FirebaseFCMService } from '../services/firebase/firebase-fcm.service';
import { ToastService } from '../components/toast/toast.service';

// Mock các Firebase functions
const mockGetToken = jasmine.createSpy('getToken');
const mockOnMessage = jasmine.createSpy('onMessage');
const mockIsSupported = jasmine.createSpy('isSupported');

// Mock ToastService
const mockToastService = {
  showInfo: jasmine.createSpy('showInfo'),
};

describe('FirebaseFCMService', () => {
  let service: FirebaseFCMService;
  let messagingMock: jasmine.SpyObj<Messaging>;

  beforeEach(() => {
    // Mock global Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        requestPermission: jasmine
          .createSpy('requestPermission')
          .and.returnValue(Promise.resolve('granted')),
      },
      writable: true,
    });

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      writable: true,
    });

    // Setup Firebase mocks using imported module
    spyOn(messagingModule, 'getToken').and.callFake(mockGetToken);
    spyOn(messagingModule, 'onMessage').and.callFake(mockOnMessage);
    spyOn(messagingModule, 'isSupported').and.callFake(mockIsSupported);

    TestBed.configureTestingModule({
      providers: [
        FirebaseFCMService,
        { provide: Messaging, useValue: {} },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    service = TestBed.inject(FirebaseFCMService);
    messagingMock = TestBed.inject(Messaging) as jasmine.SpyObj<Messaging>;
  });

  afterEach(() => {
    mockGetToken.calls.reset();
    mockOnMessage.calls.reset();
    mockIsSupported.calls.reset();
    mockToastService.showInfo.calls.reset();
  });

  describe('isSupported', () => {
    it('should return true when FCM is supported', async () => {
      mockIsSupported.and.returnValue(Promise.resolve(true));

      const result = await service.isSupported();
      expect(result).toBe(true);
    });

    it('should return false when FCM is not supported', async () => {
      mockIsSupported.and.returnValue(Promise.resolve(false));

      const result = await service.isSupported();
      expect(result).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('should request permission successfully', async () => {
      (window.Notification.requestPermission as jasmine.Spy).and.returnValue(
        Promise.resolve('granted')
      );

      const result = await service.requestPermission();
      expect(result).toBe('granted');
      expect(window.Notification.requestPermission).toHaveBeenCalled();
    });

    it('should throw error when Notification API is not available', async () => {
      // Temporarily remove Notification from window
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      await expectAsync(service.requestPermission()).toBeRejectedWith(
        'Trình duyệt không hỗ trợ thông báo'
      );

      // Restore Notification
      window.Notification = originalNotification;
    });
  });

  describe('getDeviceToken', () => {
    beforeEach(() => {
      mockIsSupported.and.returnValue(Promise.resolve(true));
      (window.Notification.requestPermission as jasmine.Spy).and.returnValue(
        Promise.resolve('granted')
      );
    });

    it('should return token when successful', async () => {
      const mockToken = 'mock-device-token';
      mockGetToken.and.returnValue(Promise.resolve(mockToken));

      const result = await service.getDeviceToken();
      expect(result).toBe(mockToken);
      expect(service.getCurrentToken()).toBe(mockToken);
    });

    it('should return null when FCM is not supported', async () => {
      mockIsSupported.and.returnValue(Promise.resolve(false));

      const result = await service.getDeviceToken();
      expect(result).toBeNull();
    });

    it('should return null when permission is denied', async () => {
      (window.Notification.requestPermission as jasmine.Spy).and.returnValue(
        Promise.resolve('denied')
      );

      const result = await service.getDeviceToken();
      expect(result).toBeNull();
    });

    it('should return null when getToken fails', async () => {
      mockGetToken.and.returnValue(Promise.resolve(null));

      const result = await service.getDeviceToken();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockGetToken.and.returnValue(Promise.reject(new Error('Token error')));

      const result = await service.getDeviceToken();
      expect(result).toBeNull();
    });
  });

  describe('listenForMessages', () => {
    it('should set up message listener when FCM is supported', () => {
      mockIsSupported.and.returnValue(true);

      const mockPayload = {
        notification: {
          title: 'Test Title',
          body: 'Test Body',
          icon: 'test-icon.png',
        },
      };

      service.listenForMessages();

      // Simulate message received
      const onMessageCallback = mockOnMessage.calls.mostRecent().args[1];
      onMessageCallback(mockPayload);

      expect(mockToastService.showInfo).toHaveBeenCalledWith('Test Title: Test Body', 5000);
    });

    it('should not set up listener when FCM is not supported', () => {
      mockIsSupported.and.returnValue(false);

      service.listenForMessages();

      expect(mockOnMessage).not.toHaveBeenCalled();
    });

    it('should create browser notification when service worker is available', () => {
      mockIsSupported.and.returnValue(true);

      // Mock Notification constructor
      const mockNotification = jasmine.createSpy('Notification');
      (window as any).Notification = mockNotification;

      const mockPayload = {
        notification: {
          title: 'Test Title',
          body: 'Test Body',
          icon: 'test-icon.png',
        },
      };

      service.listenForMessages();

      const onMessageCallback = mockOnMessage.calls.mostRecent().args[1];
      onMessageCallback(mockPayload);

      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: 'test-icon.png',
      });
    });
  });

  describe('registerDeviceToken', () => {
    it('should log success message', async () => {
      spyOn(console, 'log');

      await service.registerDeviceToken('test-token', 'user-123');

      expect(console.log).toHaveBeenCalledWith('Device token đã được đăng ký: test-token');
    });

    it('should handle errors', async () => {
      // Since registerDeviceToken currently only logs, it should not throw
      // In real implementation, this would make HTTP calls that could fail
      await expectAsync(service.registerDeviceToken('test-token')).toBeResolved();
    });
  });

  describe('unregisterDeviceToken', () => {
    it('should clear token and log success', async () => {
      // Set a token first
      service['tokenSubject'].next('test-token');
      spyOn(console, 'log');

      await service.unregisterDeviceToken('test-token');

      expect(service.getCurrentToken()).toBeNull();
      expect(console.log).toHaveBeenCalledWith('Device token đã được hủy đăng ký: test-token');
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      mockIsSupported.and.returnValue(Promise.resolve(true));
      (window.Notification.requestPermission as jasmine.Spy).and.returnValue(
        Promise.resolve('granted')
      );
    });

    it('should initialize successfully with token', async () => {
      const mockToken = 'mock-token';
      mockGetToken.and.returnValue(Promise.resolve(mockToken));

      spyOn(service, 'registerDeviceToken').and.returnValue(Promise.resolve());
      spyOn(service, 'listenForMessages');

      await service.initialize('user-123');

      expect(service.registerDeviceToken).toHaveBeenCalledWith(mockToken, 'user-123');
      expect(service.listenForMessages).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockGetToken.and.returnValue(Promise.reject(new Error('Init error')));

      spyOn(console, 'error');

      await service.initialize();

      expect(console.error).toHaveBeenCalledWith('Lỗi khi khởi tạo FCM:', jasmine.any(Error));
    });
  });

  describe('getCurrentToken', () => {
    it('should return current token', () => {
      service['tokenSubject'].next('current-token');
      expect(service.getCurrentToken()).toBe('current-token');
    });

    it('should return null when no token', () => {
      service['tokenSubject'].next(null);
      expect(service.getCurrentToken()).toBeNull();
    });
  });

  describe('Observables', () => {
    it('should emit token changes', (done) => {
      const testToken = 'test-token';

      service.token$.subscribe((token) => {
        if (token === testToken) {
          expect(token).toBe(testToken);
          done();
        }
      });

      service['tokenSubject'].next(testToken);
    });

    it('should emit message changes', (done) => {
      const testMessage = { notification: { title: 'Test' } };

      service.message$.subscribe((message) => {
        if (message === testMessage) {
          expect(message).toBe(testMessage);
          done();
        }
      });

      service['messageSubject'].next(testMessage);
    });
  });
});
