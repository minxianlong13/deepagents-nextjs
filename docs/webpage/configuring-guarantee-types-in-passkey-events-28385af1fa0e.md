<!-- source-url: https://support.cvent.com/s/communityarticle/Configuring-Guarantee-Types-in-Passkey-Events -->

# Configuring Guarantee Types in Passkey Events

When creating a Passkey event, you need to specify how your guests will guarantee and pay for the rooms they are booking. Passkey allows you to create various guarantee types which you can then assign to [attendee types](https://support.cvent.com/s/communityarticle/Managing-Attendee-Types-in-a-Passkey-Event#PK_event_att_AssignPayment) or, if your Passkey account has access to [guarantee rules](https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules), to hotels participating in your event. The guarantee types you can create are:

-   [Credit Card Only](#PK_event_guarantee_CC) - Requires guests to guarantee for their booking by providing their credit card details during the reservation process.
-   [](#PK_event_guarantee_nonCC)[Non-Credit Card](#PK_event_guarantee_nonCC) - Allows guests to guarantee for their booking by other payment methods, such as a check or purchase order to guarantee for their booking.
-   [Credit Card and Non-Credit Card](#both) - Allows guests to choose between a credit card guarantee or a non-credit card payment option.
-   [No Guarantee Required](#PK_event_no_guarantee) - Guests are not prompted to enter payment details during the reservation process, since the rooms are already guaranteed by an employer or a sponsoring organization. This guarantee type is usually known as Direct Bill.

Follow the steps below to learn how to [create guarantee types](#PK_event_guarantee_CC) and [mark one as the default](#PK_event_Default_Guarantee).

Configuring a Credit Card Only Guarantee Type

The credit card guarantee option is used to securely accept and store attendee credit card numbers and expiration dates after validation through a [MOD 10 algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm) check. Credit card information is securely transferred to hotel property management (PMS) or central reservation (CRS) systems through [RezHUB](https://support.cvent.com/s/communityarticle/Using-Passkey-RezHUB), based on specific business rules. All of this is done by following the [Payment Card Industry Data Security Standards](https://support.cvent.com/s/communityarticle/How-secure-is-Cvent).

**1 Access the Guarantee Types page.** Begin by selecting your Passkey event. From the Event navigation, click **Advanced Options**, then **Guarantee Types**.

Or, if your Passkey account has access to [guarantee rules](https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules), click **Event Home**, then **Guarantee Types** in the Event navigation.

**2 Create a Credit Card Only guarantee.** Click **Add Guarantee Type**. Provide an internal name for the payment plan. Select **Yes** next to "Guest Guarantee Required."

If a merchant account has been enabled for your event, you can [set deposit, processing, and cancellation fees](https://support.cvent.com/s/communityarticle/Setting-Up-Deposit-Processing-and-Cancellation-Fees).

If necessary, check the box next to "Card must be valid through check-out date," and, under "Instruction/Disclosures to be Displayed on the Attendee Website," enter a message for your guests.

Click **Save**.

Back on the Guarantee Types page, click **Manage** under Accepted Credit Cards, then check the boxes next to the credit card types that attendees can use when making a reservation.

Click **Save.**

Configuring a Non-Credit Card Guarantee Type

**1 Access the Guarantee Types page.** Begin by selecting your Passkey event. From the Event navigation, click **Advanced Options**, then **Guarantee Types**.

Or, if your Passkey account has access to [guarantee rules](https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules), click **Event Home**, then **Guarantee Types** in the Event navigation.

**2 Create a Non-Credit Card guarantee.** Click **Add Guarantee Type**. Provide an internal name for the payment plan.

Select **Yes** next to "Guest Guarantee Required."

Check the box next to "Non-Credit Card," and deselect the box next to "Credit Card."

If a merchant account has been enabled for your event, you can [set deposit, processing, and cancellation fees](https://support.cvent.com/s/communityarticle/Setting-Up-Deposit-Processing-and-Cancellation-Fees).

Optionally, enter a message under "Instruction/Disclosures to be Displayed on the Attendee Website."

If your hotel management system (PMS) or central reservation system (CRS) is integrated with Passkey via GroupLink, enter a message under "Reservation Payment Notes" to help you keep track of the reservations that use this payment plan.

Enter a name for the payment plan in the "Will be shown to the Attendee as" field, then specify when the payment is due by either entering a specific number of days after the reservation is made or by setting a specific due date. Don't forget to check the box next to the option you want to use.

You can enter additional reservation questions for your attendees. To make these questions visible on the Passkey booking website, check the box next to **Activate comment field on the reservation form**.

Click **Save**.

Configuring a Credit Card and Non-Credit Card Guarantee Type

**1 Access the Guarantee Types page.** Begin by selecting your Passkey event. From the Event navigation, click **Advanced Options**, then **Guarantee Types**.

Or, if your Passkey account has access to [guarantee rules](https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules), click **Event Home**, then **Guarantee Types** in the Event navigation.

**2 Create a Credit Card and Non-Credit Card guarantee.** Click **Add Guarantee Type**. Provide an internal name for the payment plan.

Select **Yes** next to "Guest Guarantee Required."

The Credit Card option will be enabled by default. Make sure you check the box next to "Non-Credit Card" as well.

Optionally, enter a message under "Instruction/Disclosures to be Displayed on the Attendee Website" for both the Credit Card and Non-Credit Card options.

Click **Save**. Both payment options will appear on the booking website for the guests to choose while making reservation.

Configuring a Payment Plan with No Guarantee Required

**1 Access the Guarantee Types page.** Begin by selecting your Passkey event. From the left-hand navigation, click **Advanced Options**, then **Guarantee Types**.

Or, if your Passkey account has access to [guarantee rules](https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules), click **Event Home**, then **Guarantee Types** in the Event navigation.

**2 Create a guarantee type with no guarantee required.** Click **Add Guarantee Type**.

Provide an internal name for the guarantee type.

Select **No** next to "Guest Guarantee Required."

Enter a message in the "Reservation Payment Notes" field to specify, for instance, that all the room costs and fees are guaranteed via an Accounts Receivable account.

If the payment should be considered as already made at the time the reservation is completed, check the box next to "Received."

Click **Save**.

Marking a Guarantee Type as the Default

**1 Access the Guarantee Types page.** Begin by selecting your Passkey event. From the left-hand navigation, click **Advanced Options**, then **Guarantee Types**.

Or, if your Passkey account has access to [guarantee rules](https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules), click **Event Home**, then **Guarantee Types** in the Event navigation.

**2 Mark a guarantee type as the default.** Locate the guarantee type you want and click **Make Default** next to it.

If your Passkey event is configured to assign guarantee types based on attendee types, the default guarantee type will be automatically assigned to any new attendee types you subsequently create in the event. [Reference this article](https://support.cvent.com/s/communityarticle/How-do-I-assign-a-different-payment-plan-to-an-attendee-type) to learn how to select a different guarantee type for an attendee type.

If your Passkey event is configured to use hotel-based [guarantee rules](https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules), the default guarantee type will be assigned to any future reservations or reservation modifications that do not meet any of the hotel-based guarantee rules you create.
