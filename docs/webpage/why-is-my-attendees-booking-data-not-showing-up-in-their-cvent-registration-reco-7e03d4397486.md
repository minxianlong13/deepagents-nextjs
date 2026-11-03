<!-- source-url: https://support.cvent.com/s/communityarticle/Why-is-my-attendees-booking-data-not-showing-up-in-their-Cvent-registration-record -->

# Why is my attendees' booking data not showing up in their Cvent registration record?

If your Cvent registration event is [integrated with Passkey](https://support.cvent.com/s/communityarticle/Setting-Up-the-Passkey-Integration-in-Registration) and no booking details show up in the Travel tab of an attendee's registration record, try the solutions below.

Manually connect the registration and booking records

If a registrant didn't initiate or complete the booking process from the Post-Registration page, and instead booked rooms directly through Passkey, you’ll need to manually link the records. If you don't have access to the Passkey event, ask the hotel or organizer who created the Passkey event to perform the steps below.

1.  Begin by accessing the corresponding Passkey event.
2.  From the Event navigation, click **Reservation Management**, then **Find RegLink**.
3.  Use the available search fields to look for the attendee's registration record.
4.  Once you find the registration record, [associate it to the existing booking record](https://support.cvent.com/s/communityarticle/Using-the-Find-RegLink-Tool#AssocWithRes).

Check the integration setup 

If the integration was not correctly configured, an attendee's booking record will not sync to the Registration event.

1.  Select the corresponding Passkey event.
2.  From the Event navigation, click **Details**, then **API Access**.
3.  Make sure the "Cvent Events" registration provider is added.
4.  Ensure you've toggled RegLink and Default Callbacks to **ON**.
5.  Access your Registration event.
6.  From the Event navigation, click **Travel**, then **Hotel Accommodations**.
7.  Click the **Hotels** tab.
8.  If the [integration was successfully set up](https://support.cvent.com/s/communityarticle/Setting-Up-the-Passkey-Integration-in-Registration), the hotels added in the Passkey event will display here.

Ask the attendee to complete the booking

1.  [Run the Registration report](https://support.cvent.com/s/communityarticle/Which-Passkey-report-should-I-run) for the corresponding Passkey event.
2.  Sort the records by the Last Name or Email column to quickly check if the attendee has both a registration and a housing record.
3.  If no housing record shows up for the attendee, it means they haven't completed the hotel booking.
4.  Advise the attendee to access their registration and use the **Select Hotel** option to proceed with their hotel booking.

Re-sync the integration

If any updates were made to the attendee types, room types, or hotels in the Passkey event, these may disrupt the Passkey integration in your Registration event.

1.  Begin by accessing your Registration event.
2.  From the Event navigation, hover over **Travel**, then click **Hotel Accommodations**.
3.  Click **Re-Sync** in the top-right.
4.  Access the corresponding Passkey event.
5.  From the left-hand navigation, click **Reservation Management**, then **Find RegLink**.
6.  Use the available search fields to look for the attendee's registration record.
7.  Once you find it, [associate it to the existing booking record](https://support.cvent.com/s/communityarticle/Using-the-Find-RegLink-Tool#AssocWithRes).

Check if the attendee is the primary guest

When a room is shared by several guests, the booking data will only be associated to the primary guest's record.

1.  Begin by accessing the corresponding Passkey event.
2.  From the Event navigation, click **Reservation Management**, then **Manage Reservations**.
3.  Use the available search filters to look for the attendee's booking.
4.  If the acknowledgement number next to the attendee's reservation does not end in a zero, it means the attendee is not the primary guest.
5.  Click the acknowledgement number link to access the reservation details.
6.  Check which guest is marked as Primary.
7.  Access your Registration event.
8.  Check that the booking details show up in the Travel tab of the primary guest's registration record.
