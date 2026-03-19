import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Shield, MapPin, Phone, Clock, Mail, Twitter, Instagram, Linkedin, Facebook, Youtube, User, MessageSquare, ArrowRight, ChevronRight, Play } from 'lucide-angular';

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
    Linkedin = Linkedin;
    Facebook = Facebook;
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

    submitContactForm(event: Event, contactForm: any) {
        event.preventDefault();
        this.formSubmitted = true;
        
        if (contactForm.invalid) {
            return;
        }

        // Here you would typically send the data to a backend service
        console.log('Form submission:', this.contactForm);
    }

    goBack() {
        this.location.back();
    }
}
