import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'overview', pathMatch: 'full' },
            { path: 'overview', loadComponent: () => import('./dashboard/overview/overview').then(m => m.Overview) },
            { path: 'endpoints', loadComponent: () => import('./dashboard/endpoints/endpoints').then(m => m.Endpoints) },
            { path: 'agent', loadComponent: () => import('./dashboard/agent/agent').then(m => m.AgentComponent) },
            { path: 'users', loadComponent: () => import('./dashboard/users/users').then(m => m.Users) },
            { path: 'incidents', loadComponent: () => import('./dashboard/incidents/incidents').then(m => m.Incidents) },
            { path: 'analytics', loadComponent: () => import('./dashboard/analytics/analytics').then(m => m.Analytics) },
            { path: 'reports', loadComponent: () => import('./dashboard/reports/reports').then(m => m.Reports) },
            { path: 'threats', loadComponent: () => import('./dashboard/threats/threats').then(m => m.Threats) },
            {
                path: 'settings',
                loadComponent: () => import('./settings/settings').then(m => m.Settings),
                children: [
                    { path: '', redirectTo: 'organization', pathMatch: 'full' },
                    { path: 'organization', loadComponent: () => import('./settings/organization/organization').then(m => m.Organization) },
                    { path: 'security', loadComponent: () => import('./settings/security/security').then(m => m.Security) },
                    { path: 'notifications', loadComponent: () => import('./settings/notifications/notifications').then(m => m.Notifications) },
                    { path: 'api-keys', loadComponent: () => import('./settings/api-keys/api-keys').then(m => m.ApiKeys) },
                    { path: 'profile', loadComponent: () => import('./settings/profile/profile').then(m => m.Profile) }
                ]
            },
            // New Routes
            { path: 'policies', loadComponent: () => import('./dashboard/placeholder.component').then(m => m.PlaceholderComponent) },
            { path: 'hardware', loadComponent: () => import('./dashboard/placeholder.component').then(m => m.PlaceholderComponent) },
            { path: 'software', loadComponent: () => import('./dashboard/placeholder.component').then(m => m.PlaceholderComponent) },
            { path: 'endpoint-groups', loadComponent: () => import('./dashboard/placeholder.component').then(m => m.PlaceholderComponent) },
            { path: 'unprotected-assets', loadComponent: () => import('./dashboard/placeholder.component').then(m => m.PlaceholderComponent) }
        ]
    },
    { path: 'topic/:name', loadComponent: () => import('./home/topic/topic').then(m => m.TopicComponent) },
    { path: 'about', loadComponent: () => import('./home/about/about').then(m => m.AboutComponent) },
    { path: 'contact', loadComponent: () => import('./home/contact/contact').then(m => m.ContactComponent) },
    { path: 'privacy-policy', loadComponent: () => import('./home/privacy-policy/privacy-policy').then(m => m.PrivacyPolicyComponent) },
    { path: 'terms-conditions', loadComponent: () => import('./home/terms-conditions/terms-conditions').then(m => m.TermsConditionsComponent) }
];
