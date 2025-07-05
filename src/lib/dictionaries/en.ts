export const enStrings = {
  header: {
    title: "Al Maidan Football Academy",
    bookField: "Book a Field",
    myBookings: "My Bookings",
    admin: "Admin",
  },
  footer: {
    copyright: "© {year} Al Maidan Football Academy. All rights reserved.",
  },
  bookingPage: {
    title: "Book Your Field",
    description: "Follow the simple steps below to reserve your football field at Al Maidan Football Academy.",
    selectDate: "Select a Date",
    selectDateDesc: "Click on a date to see available time slots.",
  },
  timeSlotPicker: {
    title: "Select a Time Slot",
    description: "Select a duration and an available time for your booking on {date}.",
    durationLabel: "Booking Duration",
    durationPlaceholder: "Select duration",
    oneHour: "1 Hour",
    twoHours: "2 Hours",
  },
  bookingForm: {
    title: "Enter Your Details",
    bookingFor: "Booking for {date} at {time} for {duration} hour(s).",
    nameLabel: "Full Name",
    namePlaceholder: "e.g. John Doe",
    phoneLabel: "Phone Number",
    phonePlaceholder: "e.g. 555-1234",
    termsLabel: "Accept terms and conditions",
    confirmButton: "Confirm Booking",
    validation: {
      nameMin: "Name must be at least 2 characters.",
      phoneFormat: "Phone number must be in XXX-XXXX format.",
      termsRequired: "You must accept the terms and conditions.",
    },
  },
  bookingsPage: {
    title: "My Bookings",
    description: "Here is a list of all your upcoming reservations at Al Maidan Football Academy.",
  },
  bookingHistoryTable: {
    date: "Date",
    time: "Time",
    duration: "Duration",
    name: "Name",
    status: "Status",
    upcoming: "Upcoming",
    noBookings: "You have no upcoming bookings.",
    durationValue: "{duration} hr(s)",
  },
  adminPage: {
    title: "Smart Scheduling Assistant",
    description: "Use our AI-powered tool to analyze booking patterns and receive recommendations for optimal scheduling to maximize facility usage.",
    dataCardTitle: "Booking Data",
    dataCardDescription: "Enter historical booking data in JSON format. You can use the current app's booking data as an example.",
    dataPlaceholder: "Paste your booking data here...",
    analyzeButton: "Analyze Patterns",
    analyzingButton: "Analyzing...",
    useMockButton: "Use App's Booking Data",
    errorTitle: "Error",
    recommendationsTitle: "Scheduling Recommendations",
    errorEmpty: "Could not get recommendations. The result was empty.",
    errorAnalyzing: "An error occurred while analyzing booking data.",
  },
  toasts: {
    bookingConfirmedTitle: "Booking Confirmed!",
    bookingConfirmedDesc: "Your booking for {date} at {time} is confirmed.",
  }
};

export type Dictionary = typeof enStrings;
