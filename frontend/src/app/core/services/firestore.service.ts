import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  updateDoc,
  orderBy,
  limit,
  getCountFromServer,
  setDoc
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, ReplaySubject, from } from 'rxjs';
import { switchMap, tap, finalize, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private db = getFirestore();
  private selectedAgentIdSubject = new BehaviorSubject<string | null>(null);
  selectedAgentId$ = this.selectedAgentIdSubject.asObservable();

  // Backend API URL — driven by environment so the token interceptor applies
  private readonly backendUrl = environment.apiUrl;

  constructor(
    private authService: AuthService,
    private zone: NgZone,
    private http: HttpClient
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
        const q = query(alertsRef, orderBy('Timestamp', 'desc'), limit(250));

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

  async sendCommand(agentId: string, commandType: string, params: any = {}): Promise<void> {
    // Route through the backend Admin SDK (token interceptor adds Firebase Bearer token).
    // This creates the commands subcollection even for brand-new agents.
    try {
      await this.http.post(
        `${this.backendUrl}/commands/agent/${agentId}`,
        { command: commandType, parameters: params }
      ).toPromise();
    } catch (err) {
      // Fallback: direct Firestore write if backend is unreachable
      console.warn('[sendCommand] Backend call failed, falling back to direct Firestore write.', err);
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
  }

  async cancelCommand(agentId: string, commandId: string) {
    const tId = await this.authService.tenantId$.pipe(first()).toPromise();
    const tenantId = tId || 'demo-org';
    const commandRef = doc(this.db, 'organizations', tenantId, 'agents', agentId, 'commands', commandId);
    
    await updateDoc(commandRef, {
        status: 'cancelled',
        updated_at: serverTimestamp()
    });
  }

  async updateAlertStatus(agentId: string, alertId: string, status: string) {
    const tId = await this.authService.tenantId$.pipe(first()).toPromise();
    const tenantId = tId || 'demo-org';
    const alertRef = doc(this.db, 'organizations', tenantId, 'agents', agentId, 'alerts', alertId);
    
    await updateDoc(alertRef, {
        status: status,
        updated_at: serverTimestamp()
    });
  }

  async updateAgent(agentId: string, data: any) {
    const tId = await this.authService.tenantId$.pipe(first()).toPromise();
    const tenantId = tId || 'demo-org';
    const agentRef = doc(this.db, 'organizations', tenantId, 'agents', agentId);
    
    await updateDoc(agentRef, {
        ...data,
        updated_at: serverTimestamp()
    });
  }

  async updateIncidentStatus(incidentId: string, status: string) {
    const tId = await this.authService.tenantId$.pipe(first()).toPromise();
    const tenantId = tId || 'demo-org';
    const incidentRef = doc(this.db, 'organizations', tenantId, 'incidents', incidentId);
    
    await updateDoc(incidentRef, {
        status: status,
        updatedAt: serverTimestamp()
    });
  }

  getOrganizationAlerts(): Observable<any[]> {
    return this.authService.tenantId$.pipe(
      switchMap(tId => {
        const tenantId = tId || 'demo-org';
        const subject = new ReplaySubject<any[]>(1);
        
        // Simpler query: only filter by organization_id, no orderBy (avoids composite index requirement)
        const alertsRef = collectionGroup(this.db, 'alerts');
        const q = query(
          alertsRef, 
          where('organization_id', '==', tenantId),
          limit(200)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          this.zone.run(() => {
            const alerts: any[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              const pathSegments = doc.ref.path.split('/');
              const agentId = pathSegments[3]; 

              alerts.push({ 
                id: doc.id, 
                agent_id: agentId,
                ...data,
                time: data['timestamp']?.toDate ? this.formatTime(data['timestamp'].toDate()) : 'Recently'
              });
            });

            // Sort client-side by timestamp descending
            alerts.sort((a, b) => {
              const tA = a['timestamp']?.seconds || 0;
              const tB = b['timestamp']?.seconds || 0;
              return tB - tA;
            });

            subject.next(alerts);
          });
        }, (error) => {
          console.error("Error fetching organization alerts:", error);
          this.zone.run(() => subject.next([]));
        });

        return subject.asObservable().pipe(
          finalize(() => unsubscribe())
        );
      })
    );
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


  getOrganizationIncidents(): Observable<any[]> {
    return this.authService.tenantId$.pipe(
      switchMap(tId => {
        const tenantId = tId || 'demo-org';
        const subject = new ReplaySubject<any[]>(1);
        const incidentsRef = collection(this.db, 'organizations', tenantId, 'incidents');
        const q = query(incidentsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          this.zone.run(() => {
            const incidents = snapshot.docs.map(d => ({
              id: d.id,
              ...d.data()
            }));
            subject.next(incidents);
          });
        }, (error) => {
          console.error('Error fetching organization incidents:', error);
          this.zone.run(() => subject.next([]));
        });

        return subject.asObservable().pipe(finalize(() => unsubscribe()));
      })
    );
  }

  async createIncident(incidentData: any) {
    const tId = await this.authService.tenantId$.pipe(first()).toPromise();
    const tenantId = tId || 'demo-org';
    const incidentsRef = collection(this.db, 'organizations', tenantId, 'incidents');

    // Generate sequential incident ID: INC-001, INC-002, ...
    const countSnap = await getCountFromServer(incidentsRef);
    const nextNum = (countSnap.data().count || 0) + 1;
    const incidentId = `INC-${String(nextNum).padStart(3, '0')}`;
    
    return await addDoc(incidentsRef, {
      ...incidentData,
      incidentId,
      timestamp: serverTimestamp(),
      status: incidentData.status || 'open'
    });
  }

  getRule(ruleId: string): Observable<any> {
    const ruleRef = doc(this.db, 'rules', ruleId);
    const subject = new ReplaySubject<any>(1);

    const unsubscribe = onSnapshot(ruleRef, (docSnap) => {
      this.zone.run(() => {
        if (docSnap.exists()) {
          subject.next({ id: docSnap.id, ...docSnap.data() });
        } else {
          subject.next(null);
        }
      });
    }, (error) => {
      console.error(`Error fetching rule ${ruleId}:`, error);
      this.zone.run(() => subject.next(null));
    });

    return subject.asObservable().pipe(
      finalize(() => unsubscribe())
    );
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
