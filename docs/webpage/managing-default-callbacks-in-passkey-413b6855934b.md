# Managing Default Callbacks in Passkey

The callback feature allows reservation data to transfer from Passkey to an event registration provider so that housing information can be displayed in the registration system and the hotel booking can be accessed, managed, and even reported on via the registration system.

If your organization is a registration provider and has a certified [RegLink integration](https://developers.cvent.com/documentation#tag/Housing), you can set up default callbacks in the organization profile. This way, any Passkey event that uses your organization as a registration provider will be able to add the callback details automatically. 

**1 Access the Event Connector page.** Hover over Manage and click **Organizer Setup**. From the left-hand navigation, under Organization, click **Event Connector**. Here you can view existing callbacks that were loaded through the integration.

**2 Add a new callback.** To include additional default callbacks, click **Add New Callback**. 

Create a label for the new callback, then enter the callback URL. Specify if the callback should be triggered when a reservation is made, modified, canceled, or when any reservation activity takes place.

Optionally, specify how many times the system should try to resend a callback if the target server returns an error, the frequency of the resend attempts, and enter an email address where error reports can be sent.

Click **Save** when you're done.

  
If you want to remove an existing default callback, click the ![Delete](https://support.cvent.com/servlet/rtaImage?eid=ka0Ui0000004YPh&feoid=00N2G00000CxUw1&refid=0EM2G000001Z5je) icon to its right, then click **Yes** to confirm.
