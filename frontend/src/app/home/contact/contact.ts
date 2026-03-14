import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Shield, MapPin, Phone, Clock, Mail, Twitter, Instagram, Youtube, User, MessageSquare, ArrowRight, ChevronRight, Play } from 'lucide-angular';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
    templateUrl: './contact.html',
    styleUrls: ['./contact.scss']
})
export class ContactComponent {
    // Icons
    Shield = Shield;
    MapPin = MapPin;
    Phone = Phone;
    Clock = Clock;
    Mail = Mail;
    Twitter = Twitter;
    Instagram = Instagram;
    Youtube = Youtube;
    User = User;
    MessageSquare = MessageSquare;
    ArrowRight = ArrowRight;
    ChevronRight = ChevronRight;
    Play = Play;

    // Form Data
    contactForm = {
        firstName: '',
        lastName: '',
        workEmail: '',
        phone: '',
        message: ''
    };

    formSubmitted = false;
    scrolled = false;

    constructor(private location: Location) {}

    submitContactForm(event: Event) {
        event.preventDefault();
        // Here you would typically send the data to a backend service
        console.log('Form submission:', this.contactForm);
        this.formSubmitted = true;
    }

    goBack() {
        this.location.back();
    }
}
