import { Injectable } from '@angular/core';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  collectionGroup,
  doc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private db = getFirestore();
  private selectedAgentIdSubject = new BehaviorSubject<string | null>(null);
  selectedAgentId$ = this.selectedAgentIdSubject.asObservable();

  constructor(private authService: AuthService) {}

  setSelectedAgent(id: string | null) {
    this.selectedAgentIdSubject.next(id);
  }

  getSelectedAgentId(): string | null {
    return this.selectedAgentIdSubject.value;
  }

  getAgentDetails(agentId: string): Observable<any> {
    const subject = new BehaviorSubject<any>(null);
    const tenantId = this.authService.tenantId || 'demo-org';
    const agentDocRef = doc(this.db, 'organizations', tenantId, 'agents', agentId);

    onSnapshot(agentDocRef, (docSnap) => {
      if (docSnap.exists()) {
        subject.next({ id: docSnap.id, ...docSnap.data() });
      } else {
        subject.next(null);
      }
    });

    return subject.asObservable();
  }

  getAgentAlerts(agentId: string): Observable<any[]> {
    const subject = new BehaviorSubject<any[]>([]);
    const tenantId = this.authService.tenantId || 'demo-org';
    const alertsRef = collection(this.db, 'organizations', tenantId, 'agents', agentId, 'alerts');
    const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50));

    onSnapshot(q, (querySnapshot) => {
      const alerts: any[] = [];
      querySnapshot.forEach((doc) => {
        alerts.push({ id: doc.id, ...doc.data() });
      });
      subject.next(alerts);
    });

    return subject.asObservable();
  }

  getAgentCommands(agentId: string): Observable<any[]> {
    const subject = new BehaviorSubject<any[]>([]);
    const tenantId = this.authService.tenantId || 'demo-org';
    const commandsRef = collection(this.db, 'organizations', tenantId, 'agents', agentId, 'commands');
    const q = query(commandsRef, orderBy('timestamp', 'desc'), limit(10));

    onSnapshot(q, (querySnapshot) => {
      const commands: any[] = [];
      querySnapshot.forEach((doc) => {
        commands.push({ id: doc.id, ...doc.data() });
      });
      subject.next(commands);
    });

    return subject.asObservable();
  }

  async sendCommand(agentId: string, commandType: string, params: any = {}) {
    const tenantId = this.authService.tenantId || 'demo-org';
    const commandsRef = collection(this.db, 'organizations', tenantId, 'agents', agentId, 'commands');
    
    await addDoc(commandsRef, {
      command: commandType,
      parameters: params,
      status: 'pending',
      timestamp: serverTimestamp(),
      created_by: this.authService.userProfile$ // This might need a value
    });
  }
}
