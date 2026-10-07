import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playScanSound, playErrorSound, parseBoothFromScan } from '../utils/qrHelper';
import type { BoothConfig } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  targetBooth?: BoothConfig | null;
}

const CONTAINER_ID = 'ts-camera-qr-viewport';

export function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  targetBooth,
}: QRScannerModalProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [hasScanned, setHasScanned] = useState(false);
  const [boothMismatch, setBoothMismatch] = useState<{
    expectedBooth: BoothConfig;
    scannedBooth: BoothConfig;
  } | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const isMismatchRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    } catch {
      // Ignore stop errors on unmount
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  const handleDismissMismatch = () => {
    isMismatchRef.current = false;
    setBoothMismatch(null);
  };

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (hasScanned || isMismatchRef.current) return;

      // Validate target booth if user clicked a specific booth
      if (targetBooth) {
        const { booth } = parseBoothFromScan(decodedText);
        if (booth && booth.id !== targetBooth.id) {
          isMismatchRef.current = true;
          playErrorSound();
          setBoothMismatch({
            expectedBooth: targetBooth,
            scannedBooth: booth,
          });
          return;
        }
      }

      setHasScanned(true);
      playScanSound();

      await stopCamera();
      onScanSuccess(decodedText);
    },
    [hasScanned, targetBooth, stopCamera, onScanSuccess]
  );

  // Initialize and start scanner when open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setHasScanned(false);
    setBoothMismatch(null);
    isMismatchRef.current = false;
    setCameraError(null);
    setIsStarting(true);
    isStoppingRef.current = false;

    async function initCamera() {
      try {
        // Enumerate devices to find rear/environment cameras
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        if (!mounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment/back camera if available
          const backCam = devices.find((d) =>
            /back|rear|environment|wide/i.test(d.label)
          );
          if (backCam) {
            setSelectedCameraId(backCam.id);
          } else {
            setSelectedCameraId(devices[0].id);
          }
        }

        const scanner = new Html5Qrcode(CONTAINER_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;

        // Start scanning with environment facing mode
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (text) => {
            if (mounted) {
              handleScan(text);
            }
          },
          () => {
            // Frame scan failure; normal while camera is searching
          }
        );

        if (!mounted) {
          if (scanner.isScanning) await scanner.stop();
          scanner.clear();
          return;
        }

        setIsStarting(false);

        // Check torch capability
        try {
          const capabilities = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        } catch {
          // torch check not supported
        }
      } catch (err: unknown) {
        if (!mounted) return;
        setIsStarting(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setCameraError(
            'Camera permission was denied. Please allow camera access in your browser settings to scan QR codes.'
          );
        } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
          setCameraError('No camera found on this device. You can upload an image of the QR code instead.');
        } else {
          setCameraError('Unable to start camera stream. You can upload an image of the QR code or select a booth.');
        }
      }
    }

    // Delay briefly so container is mounted in DOM
    const timer = setTimeout(() => {
      initCamera();
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, handleScan, stopCamera]);

  // Switch camera if user has multiple cameras
  const handleSwitchCamera = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    setIsStarting(true);
    setCameraError(null);
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      if (scannerRef.current) {
        await scannerRef.current.start(
          cameraId,
          {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          (text) => {
            handleScan(text);
          },
          () => {}
        );
      }
      setIsStarting(false);
    } catch {
      setIsStarting(false);
      setCameraError('Failed to switch camera.');
    }
  };

  // Toggle torch / flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as MediaTrackConstraintSet],
      });
      setTorchOn(nextState);
    } catch {
      // torch failed
    }
  };

  // Scan from file fallback
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsStarting(true);
      setCameraError(null);
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(CONTAINER_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;
      }

      if (scanner.isScanning) {
        await scanner.stop();
      }

      const decodedText = await scanner.scanFile(file, true);
      handleScan(decodedText);
    } catch {
      setIsStarting(false);
      setCameraError('No QR code detected in the uploaded image. Please try another image.');
    }
  };

  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ts-scanner-backdrop" onClick={handleClose}>
      <div
        className="ts-scanner-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ts-scanner-title"
      >
        {/* Header */}
        <div className="ts-scanner-header">
          <div className="ts-scanner-header__info">
            <span className="ts-scanner-tag">LIVE QR SCANNER</span>
            <h2 id="ts-scanner-title" className="ts-scanner-title">
              {targetBooth
                ? `Scan Booth ${targetBooth.number} QR Code`
                : 'Scan Any Booth QR to Play'}
            </h2>
          </div>
          <button
            type="button"
            className="ts-scanner-close"
            onClick={handleClose}
            aria-label="Close camera scanner"
          >
            ✕
          </button>
        </div>

        {/* Viewport Frame */}
        <div className="ts-scanner-body">
          <div className="ts-scanner-viewport-wrap">
            {/* html5-qrcode target container */}
            <div id={CONTAINER_ID} className="ts-scanner-video-container" />

            {/* Futuristic overlay viewfinder */}
            <div className="ts-scanner-overlay">
              <div className="ts-scanner-target-box">
                <div className="ts-scanner-corner ts-scanner-corner--tl" />
                <div className="ts-scanner-corner ts-scanner-corner--tr" />
                <div className="ts-scanner-corner ts-scanner-corner--bl" />
                <div className="ts-scanner-corner ts-scanner-corner--br" />
                <div className="ts-scanner-laser" />
              </div>
            </div>

            {/* Starting loader */}
            {isStarting && !cameraError && (
              <div className="ts-scanner-status-overlay">
                <div className="ts-scanner-spinner" />
                <span>Starting Camera...</span>
              </div>
            )}

            {/* Success indicator */}
            {hasScanned && (
              <div className="ts-scanner-status-overlay ts-scanner-status-overlay--success">
                <span className="ts-scanner-check">✓</span>
                <span>QR Scanned! Launching Challenge...</span>
              </div>
            )}

            {/* Error overlay */}
            {cameraError && (
              <div className="ts-scanner-status-overlay ts-scanner-status-overlay--error">
                <span className="ts-scanner-err-icon">⚠️</span>
                <p className="ts-scanner-err-text">{cameraError}</p>
                <button
                  type="button"
                  className="ts-scanner-retry-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Upload Photo of QR Code
                </button>
              </div>
            )}

            {/* Booth mismatch error overlay */}
            {boothMismatch && (
              <div className="ts-scanner-status-overlay ts-scanner-status-overlay--mismatch" role="alert">
                <span className="ts-scanner-err-icon">❌</span>
                <div className="ts-scanner-mismatch-title">WRONG BOOTH SCANNED</div>
                <p className="ts-scanner-mismatch-desc">
                  You clicked to scan <strong>Booth {boothMismatch.expectedBooth.number} ({boothMismatch.expectedBooth.title})</strong>,
                  but scanned <strong>Booth {boothMismatch.scannedBooth.number} ({boothMismatch.scannedBooth.title})</strong>.
                </p>
                <p className="ts-scanner-mismatch-instruction">
                  Please scan the official QR code at <strong>Booth {boothMismatch.expectedBooth.number}</strong>!
                </p>
                <button
                  type="button"
                  className="ts-scanner-retry-btn ts-scanner-retry-btn--mismatch"
                  onClick={handleDismissMismatch}
                >
                  🔄 Scan Booth {boothMismatch.expectedBooth.number} Again
                </button>
              </div>
            )}
          </div>

          <p className="ts-scanner-instruction">
            Point your camera at the QR code on the booth standee.
            The challenge will open automatically once detected!
          </p>

          {/* Controls Bar */}
          <div className="ts-scanner-controls">
            {cameras.length > 1 && (
              <div className="ts-scanner-camera-picker">
                <label htmlFor="ts-camera-select">Camera:</label>
                <select
                  id="ts-camera-select"
                  value={selectedCameraId || ''}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                >
                  {cameras.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hasTorch && (
              <button
                type="button"
                className={`ts-scanner-tool-btn ${torchOn ? 'ts-scanner-tool-btn--active' : ''}`}
                onClick={handleToggleTorch}
              >
                🔦 {torchOn ? 'Flash On' : 'Flash Off'}
              </button>
            )}

            {/* Photo upload fallback button */}
            <button
              type="button"
              className="ts-scanner-tool-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Choose Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="ts-scanner-footer">
          <button type="button" className="ts-scanner-cancel-btn" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
