<!-- source-url: https://support.cvent.com/s/communityarticle/Setting-Up-GroupLink-for-a-Passkey-Event -->

# Setting Up GroupLink for a Passkey Event

GroupLink is an integration feature that facilitates reservation transfers between Passkey and a hotel's property management system (PMS) or central reservation system (CRS). Once the integration has been implemented for your hotel, [watch this video](https://videos.cvent.com/watch/4HLszSUM82CCHBaPedasmM), or follow the steps below to learn how to map blocks, payment types, room types, and attendee types in a Passkey event to ensure the successful transfer of reservation data.

**1 Access GroupLink in your event.** Begin by selecting your Passkey event. From the Event navigation, click **GroupLink**. Click **Select** next to the hotel name, then click **Go to GroupLink setup**.

**NOTE:** When you are performing the initial GroupLink setup for a hotel, you will progress through each setup page by clicking **Save and continue** in the bottom-right. You can only progress to the next page after you've filled in all the mandatory fields on the page you are currently on.

**2 Map your event.** Enter the block code that was configured in your hotel PMS or CRS for this event. The code should not exceed 36 characters. While the code is usually alphanumeric, it also accepts the following special characters: full stop (.), comma (,), dash (-), colon (:), underscore (\_), forward slash (/) and backslash (\\).

In the Reservation Transfers section, review and, if necessary, update the start and end dates for reservation transfers. If there is a two-way integration between Passkey and your hotel PMS or CRS, you'll see two sets of dates, one for outbound and one for inbound reservation transfers.

For events that your hotel is managing independently, the default transfer start date is the date when the event was created in Passkey.

For Citywide events your hotel was added to, the default transfer start date is the [reservation access date](https://support.cvent.com/s/communityarticle/Key-Dates-and-Times-in-Passkey-Events#PK_Hotel_inv_dates). 

**NOTE:** If you change the reservation access date for the hotel, the default transfer start date will be automatically changed to match the new reservation access date.

If your PMS or CRS supports reservation code mapping for parameters such as the market segment or market source, you can add the appropriate codes in the Reservation Codes section.

In the Payment Types section, check that the payment type codes match the ones in your hotel PMS or CRS. If you need to make any changes to the existing codes, click the **Edit** icon next to the code you want to modify.

Click **Save and continue**.

**3 Map your room types.**  Review the room types listed on this page and ensure the room type codes match the ones in your hotel PMS or CRS. 

**NOTE:** Some hotel systems do not require room type codes to be added. If the room type is not marked with an asterisk (\*) to indicate that the field is mandatory, you can leave the room type code field blank.

To make changes to an existing room type code, click the **Edit** icon next to it.

If your PMS or CRS supports occupancy rate codes, enter the appropriate values in the Occupancy section for each room type.

Click **Save and continue**.

**4 Map your attendee types.** Review the attendee types listed on this page. 

If you need to make any changes to an attendee type, begin by clicking its name to expand it. Review and, if necessary, update the block code by clicking the **Edit** icon next to it.

Click **View advanced settings** to review and, if necessary, update the reservation and payment type codes for the attendee type.

Click **Save and continue**. In the popup that appears, click **OK** to confirm that you want to populate the event, room type, and attendee type settings to the Sub-Blocks tab.

**5 Review and finish the GroupLink setup.** The Sub-Blocks page reflects all the configurations made on the previous pages of the GroupLink setup workflow. 

Review each sub-block in turn by clicking its name.

If necessary, click **View advanced settings** to review reservation and payment type codes for the sub-block. If you want to prevent the transfer of reservations for a specific sub-block, click **Suspend transfer**.

Once you've reviewed all the sub-blocks, click **Save and complete**. Provided you have not suspended the reservation transfer for any of the sub-blocks, all the sub-blocks will show as approved for transfer, and the GroupLink setup status will now be complete.

The codes in the Sub-Blocks tab are the ones attached to reservations when they transfer via GroupLink. If you need to make changes to any of the codes after the initial setup is complete, we recommend performing the changes in the Sub-Blocks tab.

Reservations will start transferring on the date configured in the Event tab of the GroupLink setup. [Reference this article](https://support.cvent.com/s/communityarticle/Suspending-Reservation-Transfers-in-Passkey) if you need to suspend reservation transfers for the entire block or for specific sub-blocks after the transfer start date.

Any reservations that fail to transfer can be managed through [RezHub](https://support.cvent.com/s/communityarticle/Using-Passkey-RezHUB). 

To receive alerts about reservations that fail to transfer, make sure you [set up Grouplink notifications for your contacts](https://support.cvent.com/s/communityarticle/Managing-Hotel-Contacts-in-Passkey) and [GroupLink reminders](https://support.cvent.com/s/communityarticle/Setting-Up-GroupLink-Notifications) in your hotel's Passkey profile.
