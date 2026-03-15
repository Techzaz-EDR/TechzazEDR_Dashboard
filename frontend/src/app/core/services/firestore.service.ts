import { Injectable, NgZone } from '@angular/core';
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
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { switchMap, tap, finalize, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private db = getFirestore();
  private selectedAgentIdSubject = new BehaviorSubject<string | null>(null);
  selectedAgentId$ = this.selectedAgentIdSubject.asObservable();

  constructor(
    private authService: AuthService,
    private zone: NgZone
  ) {}

  setSelectedAgent(id: string | null) {
    this.selectedAgentIdSubject.next(id);
  }

  getSelectedAgentId(): string | null {
    return this.selectedAgentIdSubject.value;
  }

  getAgents(): Observable<any[]> {
    return this.authService.tenantId$.pipe(
      switchMap(tId => {
        const tenantId = tId || 'demo-org';
        const subject = new ReplaySubject<any[]>(1);
        const agentsRef = collection(this.db, 'organizations', tenantId, 'agents');
        const q = query(agentsRef, orderBy('last_seen', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          this.zone.run(() => {
            const agents: any[] = [];
            querySnapshot.forEach((doc) => {
              agents.push({ id: doc.id, ...doc.data() });
            });
            subject.next(agents);
          });
        }, (error) => {
          console.error("Error fetching agents:", error);
          this.zone.run(() => subject.next([]));
        });

        return subject.asObservable().pipe(
          finalize(() => unsubscribe())
        );
      })
    );
  }

  getAgentDetails(agentId: string): Observable<any> {
    return this.authService.tenantId$.pipe(
      switchMap(tId => {
        const tenantId = tId || 'demo-org';
        const subject = new ReplaySubject<any>(1);
        const agentDocRef = doc(this.db, 'organizations', tenantId, 'agents', agentId);

        const unsubscribe = onSnapshot(agentDocRef, (docSnap) => {
          this.zone.run(() => {
            if (docSnap.exists()) {
              subject.next({ id: docSnap.id, ...docSnap.data() });
            } else {
              subject.next(null);
            }
          });
        }, (error) => {
          console.error("Error fetching agent details:", error);
          this.zone.run(() => subject.next(null));
        });

        return subject.asObservable().pipe(
          finalize(() => unsubscribe())
        );
      })
    );
  }

  getAgentAlerts(agentId: string): Observable<any[]> {
    return this.authService.tenantId$.pipe(
      switchMap(tId => {
        const tenantId = tId || 'demo-org';
        const subject = new ReplaySubject<any[]>(1);
        const alertsRef = collection(this.db, 'organizations', tenantId, 'agents', agentId, 'alerts');
        const q = query(alertsRef, orderBy('Timestamp', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          this.zone.run(() => {
            const alerts: any[] = [];
            querySnapshot.forEach((doc) => {
              alerts.push({ id: doc.id, ...doc.data() });
            });
            subject.next(alerts);
          });
        }, (error) => {
          console.error("Error fetching agent alerts:", error);
          this.zone.run(() => subject.next([]));
        });

        return subject.asObservable().pipe(
          finalize(() => unsubscribe())
        );
      })
    );
  }

  getAgentCommands(agentId: string): Observable<any[]> {
    return this.authService.tenantId$.pipe(
      switchMap(tId => {
        const tenantId = tId || 'demo-org';
        const subject = new ReplaySubject<any[]>(1);
        const commandsRef = collection(this.db, 'organizations', tenantId, 'agents', agentId, 'commands');
        const q = query(commandsRef, orderBy('timestamp', 'desc'), limit(10));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          this.zone.run(() => {
            const commands: any[] = [];
            querySnapshot.forEach((doc) => {
              commands.push({ id: doc.id, ...doc.data() });
            });
            subject.next(commands);
          });
        }, (error) => {
          console.error("Error fetching agent commands:", error);
          this.zone.run(() => subject.next([]));
        });

        return subject.asObservable().pipe(
          finalize(() => unsubscribe())
        );
      })
    );
  }

  async sendCommand(agentId: string, commandType: string, params: any = {}) {
    const tId = await this.authService.tenantId$.pipe(first()).toPromise();
    const tenantId = tId || 'demo-org';
    const commandsRef = collection(this.db, 'organizations', tenantId, 'agents', agentId, 'commands');
    
    await addDoc(commandsRef, {
      command: commandType,
      parameters: params,
      status: 'pending',
      timestamp: serverTimestamp(),
      created_by: 'system'
    });
  }

  getIncidents(): Observable<any[]> {
    return this.authService.tenantId$.pipe(
      switchMap(tId => {
        const tenantId = tId || 'demo-org';
        const subject = new ReplaySubject<any[]>(1);
        const incidentsRef = collection(this.db, 'organizations', tenantId, 'incidents');
        const q = query(incidentsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          this.zone.run(() => {
            const incidents: any[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              incidents.push({ 
                id: doc.id, 
                ...data,
                title: data['title'] || data['name'] || 'Untitled Incident',
                description: data['description'] || 'No description provided',
                status: data['status'] || 'open',
                priority: data['priority'] || data['severity'] || 'medium',
                threats: data['threats'] || 0,
                endpoints: data['endpoints_count'] || (Array.isArray(data['endpoints']) ? data['endpoints'].length : 0),
                time: data['timestamp']?.toDate ? this.formatTime(data['timestamp'].toDate()) : 'Recently',
                assignee: data['assignee'] || 'Unassigned'
              });
            });
            subject.next(incidents);
          });
        }, (error) => {
          console.error("Error fetching incidents:", error);
          this.zone.run(() => subject.next([]));
        });

        return subject.asObservable().pipe(
          finalize(() => unsubscribe())
        );
      })
    );
  }

  async addIncident(incident: any) {
    const tId = await this.authService.tenantId$.pipe(first()).toPromise();
    const tenantId = tId || 'demo-org';
    const incidentsRef = collection(this.db, 'organizations', tenantId, 'incidents');
    
    await addDoc(incidentsRef, {
      ...incident,
      timestamp: serverTimestamp()
    });
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60) ;
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }
}
