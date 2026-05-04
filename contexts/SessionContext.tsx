import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, ScannedPackage } from "../types/session";
import { addSession, loadSessions } from "../utils/storage";
import { generateId } from "../utils/session";

type AppScreen = "scanning" | "report" | "history";

interface SessionContextType {
  // State
  screen: AppScreen;
  showInitModal: boolean;
  currentSession: Session | null;
  packageListExpanded: boolean;
  lastScanned: ScannedPackage | null;
  duplicateVisible: boolean;
  duplicateCode: string;
  duplicateOriginal: ScannedPackage | undefined;
  divergenceVisible: boolean;
  completedSession: Session | null;
  sessions: Session[];
  isLoading: boolean;

  // Actions
  setScreen: (screen: AppScreen) => void;
  handleStartSession: (
    operatorName: string,
    driverName: string,
    declaredCounts: { shopee: number; mercadoLivre: number; avulso: number },
  ) => void;
  handleScan: (pkg: ScannedPackage) => void;
  handleDuplicate: (code: string) => void;
  handleEndSession: () => void;
  finalizeSession: (hasDivergence: boolean) => Promise<void>;
  handleDivergenceCancel: () => void;
  handleNewSession: () => void;
  handleViewHistory: () => void;
  setPackageListExpanded: (expanded: boolean) => void;
  setDuplicateVisible: (visible: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [screen, setScreen] = useState<AppScreen>("scanning");
  const [showInitModal, setShowInitModal] = useState(true);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [packageListExpanded, setPackageListExpanded] = useState(false);
  const [lastScanned, setLastScanned] = useState<ScannedPackage | null>(null);
  const [duplicateVisible, setDuplicateVisible] = useState(false);
  const [duplicateCode, setDuplicateCode] = useState("");
  const [duplicateOriginal, setDuplicateOriginal] = useState<
    ScannedPackage | undefined
  >();
  const [divergenceVisible, setDivergenceVisible] = useState(false);
  const [completedSession, setCompletedSession] = useState<Session | null>(
    null,
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  const handleStartSession = (
    operatorName: string,
    driverName: string,
    declaredCounts: { shopee: number; mercadoLivre: number; avulso: number },
  ) => {
    const totalDeclared =
      declaredCounts.shopee +
      declaredCounts.mercadoLivre +
      declaredCounts.avulso;
    const session: Session = {
      id: generateId(),
      operatorName,
      driverName,
      declaredCount: totalDeclared,
      declaredCounts,
      packages: [],
      startedAt: new Date().toISOString(),
      hasDivergence: false,
    };
    setCurrentSession(session);
    setShowInitModal(false);
    setScreen("scanning");
    setLastScanned(null);
    setPackageListExpanded(false);
  };

  const handleScan = (pkg: ScannedPackage) => {
    if (!currentSession) return;
    const updated = {
      ...currentSession,
      packages: [...currentSession.packages, pkg],
    };
    setCurrentSession(updated);
    setLastScanned(pkg);
    const scannedCount = updated.packages.length;
    const declaredCount = updated.declaredCount;
    if (scannedCount === declaredCount) {
      setDivergenceVisible(false);
    }
  };

  const handleDuplicate = (code: string) => {
    if (!currentSession) return;
    const original = currentSession.packages.find((p) => p.code === code);
    setDuplicateCode(code);
    setDuplicateOriginal(original);
    setDuplicateVisible(true);
  };

  const handleEndSession = () => {
    if (!currentSession) return;
    const scannedCount = currentSession.packages.length;
    const declaredCount = currentSession.declaredCount;
    if (scannedCount !== declaredCount) {
      setDivergenceVisible(true);
    } else {
      finalizeSession(false);
    }
  };

  const finalizeSession = async (hasDivergence: boolean) => {
    if (!currentSession) return;
    setIsLoading(true);
    const finalized: Session = {
      ...currentSession,
      completedAt: new Date().toISOString(),
      hasDivergence,
    };
    setCompletedSession(finalized);
    try {
      await addSession(finalized);
      const updated = await loadSessions();
      setSessions(updated);
    } catch (error) {
      console.error("Failed to save session:", error);
      // TODO: Show error to user
    } finally {
      setIsLoading(false);
    }
    setDivergenceVisible(false);
    setScreen("report");
  };

  const handleDivergenceCancel = () => {
    setDivergenceVisible(false);
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setCompletedSession(null);
    setLastScanned(null);
    setShowInitModal(true);
    setScreen("scanning");
  };

  const handleViewHistory = () => {
    setScreen("history");
  };

  const value: SessionContextType = {
    screen,
    showInitModal,
    currentSession,
    packageListExpanded,
    lastScanned,
    duplicateVisible,
    duplicateCode,
    duplicateOriginal,
    divergenceVisible,
    completedSession,
    sessions,
    isLoading,
    setScreen,
    handleStartSession,
    handleScan,
    handleDuplicate,
    handleEndSession,
    finalizeSession,
    handleDivergenceCancel,
    handleNewSession,
    handleViewHistory,
    setPackageListExpanded,
    setDuplicateVisible,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
