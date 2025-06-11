// components/BookingCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { format, parse } from 'date-fns';
import colors from '../constants/colors';

const BookingCard = ({ booking, onCancel, onAccept }) => {
  // --- DEBUG LOGS ---
  console.log('BookingCard rendered for booking:', booking?.id);
  console.log('BookingCard onAccept prop:', typeof onAccept);
  console.log('BookingCard onCancel prop:', typeof onCancel);
  // --- END DEBUG LOGS ---

  if (!booking) {
    return null;
  }

  let displayDateTime = 'N/A Date/Time';
  if (booking.bookingDate && booking.time) { // Using bookingDate from MyBookingsScreen mapping, and time
    try {
      // MyBookingsScreen passes bookingDate (string) and time (string)
      const dateTimeString = `${booking.bookingDate} ${booking.time}`;
      const parsedDateTime = parse(dateTimeString, 'yyyy-MM-dd HH:mm', new Date());
      displayDateTime = format(parsedDateTime, 'MMM dd,PPPP hh:mm a');
    } catch (e) {
      console.error('Error parsing booking date/time in BookingCard:', e);
      displayDateTime = 'Invalid Date/Time';
    }
  } else if (booking.date && booking.time) { // Fallback for BarberDashboard which passes 'date'
     try {
      const dateTimeString = `${booking.date} ${booking.time}`;
      const parsedDateTime = parse(dateTimeString, 'yyyy-MM-dd HH:mm', new Date());
      displayDateTime = format(parsedDateTime, 'MMM dd,PPPP hh:mm a');
    } catch (e) {
      console.error('Error parsing booking date/time in BookingCard (fallback):', e);
      displayDateTime = 'Invalid Date/Time';
    }
  }


  const photoUrl = booking.clientPhotoUrl || booking.barberProfilePhoto || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo';
  // Use clientName for client bookings, barberDisplayName for barber dashboard view
  const displayName = booking.clientName || booking.clientDisplayName || booking.barberDisplayName || 'Unknown Party';

  const serviceToDisplay = booking.serviceName || booking.servicesSummary || 'Services not listed';
  const priceToDisplay = booking.price || booking.totalPrice;


  const showAcceptButton = booking.status === 'pending' && typeof onAccept === 'function';
  const showCancelButton = typeof onCancel === 'function';

  return (
    <View style={styles.card}>
      <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
      <View style={styles.details}>
        <Text style={styles.clientName}>{displayName}</Text>
        <Text style={styles.service}>{serviceToDisplay}</Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.date}>
            {displayDateTime}
          </Text>
          <Text style={styles.price}>${priceToDisplay?.toFixed(2) || '0.00'}</Text>
        </View>
        
        <Text style={styles.status}>Status: {booking.status}</Text>

        {booking.notes && (
          <Text style={styles.notes}>Notes: {booking.notes}</Text>
        )}
      </View>
      
      <View style={styles.actions}>
        {showAcceptButton && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]} 
            onPress={() => {
              console.log('Accept button pressed for booking ID:', booking.id); // DEBUG
              onAccept(booking.id);
            }}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        )}
        {showCancelButton && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]} 
            onPress={() => {
              console.log('Cancel button pressed for booking ID:', booking.id); // DEBUG
              onCancel(booking.id);
            }}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: colors.lightGray,
  },
  details: {
    flex: 1,
    marginRight: 10,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: colors.text,
  },
  service: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: colors.primary,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  status: {
    fontSize: 13,
    color: colors.gray,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  notes: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 5,
    alignItems: 'center',
    width: 80,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.lightError,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default BookingCard;