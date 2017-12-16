//CLASSE FIREBASE PARA O CLIENTE ACAO
function FirebaseAcaoHelper(){

    var config = {
        apiKey: "AIzaSyBn8N-84KxUOnWmEmsQtiMppkcaaUzQnvw",
        authDomain: "acao-f519d.firebaseapp.com",
        databaseURL: "https://acao-f519d.firebaseio.com",
        storageBucket: "acao-f519d.appspot.com",
        messagingSenderId: "1075782663282"
    };

    var acaoRef;
    this.uid;
    this.type;
    this.email;
    this.name;
    this.firebaseUserExists;
    this.currentChatId;
    var storage;
    var storageRef;
    var pathReference;

    /**
     * Initialize Firebase
     */
    this.firebaseConfig = function() {
        firebase.initializeApp(config);
        acaoRef = firebase.database().ref();

        // Create a reference with an initial file path and name
        storage = firebase.storage();
        storageRef = storage.ref();
        pathReference = storage.ref('images/space.jpg');

        // Create a reference from a Google Cloud Storage URI
        // var gsReference = storage.refFromURL('gs://bucket/images/stars.jpg')

        // Create a reference from an HTTPS URL
        // Note that in the URL, characters are URL escaped!
        // var httpsReference = storage.refFromURL('https://firebasestorage.googleapis.com/b/bucket/o/images%20stars.jpg');
      };

    /**
     * Authenticate user
     * @param functionAfter
     */
    this.acaoAuthentication = function(functionAfter) {

        firebase.auth().onAuthStateChanged(firebaseUser => {

            if (firebaseUser) {
                this.firebaseUserExists = true;

                acaoRef.child('users').child(firebaseUser.uid).once('value', user => {
                    this.email = user.val().email;
                    this.name = user.val().name;
                    this.type = user.val().type;
                    this.uid = user.key;
                    functionAfter();
                });

            } else {
                this.firebaseUserExists = false;
                functionAfter();
            }
        });
    };
    // https://firebasestorage.googleapis.com/v0/b/acao-f519d.appspot.com/o/images%2Fspace.jpg?alt=media&token=286341e5-fcac-47e2-81a7-b9f37d55ce1d

    this.showImage = function(imgElementId) {
      storageRef.child('images/space.jpg').getDownloadURL().then(function(url) {
        console.log('++++');
        console.log(url);

        // `url` is the download URL for 'images/stars.jpg'

        // This can be downloaded directly:
        // var xhr = new XMLHttpRequest();
        // xhr.responseType = 'blob';
        // xhr.onload = function(event) {
        //   var blob = xhr.response;
        // };
        // xhr.open('GET', url);
        // xhr.send();

        // Or inserted into an <img> element:
        // var img = document.getElementById(imgElementId);
        // console.log(img);
        // img.src = url;
        // $('#logo').src = url;

        return url;
      }).catch(function(error) {
        // Handle any errors
      });

      console.log("funcao");

    };

    // Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
    this.setImageUrl = function(imageUri, imgElement) {
      // If the image is a Cloud Storage URI we fetch the URL.
      if (imageUri.startsWith('gs://')) {
        // imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
        storage.refFromURL(imageUri).getDownloadURL().then(function(url) {
          imgElement.src = url;
        });
      } else {
        // imgElement.src = imageUri;
        // this.setImageUrl(imageUri, imgElement);
      }
    };

    this.getImageUrl = function(imageUri) {
      // console.log('merda');
      // console.log(imageUri);
      // return(imageUri);
      // If the image is a Cloud Storage URI we fetch the URL.
      // if (imageUri.startsWith('gs://')) {
        // imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
        // storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
        //   return metadata.downloadURLs[0];
        // });
        storage.refFromURL(imageUri).getDownloadURL().then(function(url) {
          console.log(url);
          // return url;
        });
      // } else {
      //   return imageUri;
      // }
    }

    /**
     * Logs the user in
     * @param email user email
     * @param password user password
     * @returns {*|{name, a}} promise - retorna objeto com mensagem de erro ou valida��o de login
     */
    this.login = function(email, password) {
        firebase.auth().signOut();

        var auth = firebase.auth();

        var promise = auth.signInWithEmailAndPassword(email, password);

        return promise
    };

    /**
     * Logs the user out
     */
    this.signOut = function() {
        acaoRef.off();
        firebase.auth().signOut();
    };

    /**
     * Subscribes for chats to which the current user belongs to
     * @param functionAfter createNavigationLink
     */
    this.subscribeForUserChatsUpdates = function(functionAfter) {

        //certifica de que n�o possui listen aberto
        acaoRef.child('user-chats-properties').child(this.uid).off();

        acaoRef.child('user-chats-properties').child(this.uid).orderByChild('latestMessageTimestamp').on('child_added', chat => {
            functionAfter(chat);
        });

        acaoRef.child('user-chats-properties').child(this.uid).on('child_changed', chat => {
            updateBadge(chat);
            // TODO: atualizar SubscribeForMessagesUpdatesusuário que tiver suas características modificadas
            // functionAfter(user.val());
        });

        acaoRef.child('user-chats-properties').child(this.uid).on('child_removed', user => {
            // TODO: remover usuário que for apagado do Firebase
            // functionAfter(user.val());
        });

    };

    /**
     * Opens selected chat
     * @param chatId selected chat ID
     * @param functionAfter displayChatMessage
     */
    this.openChat = function(chatId, functionAfter) {

        this.subscribeForMessagesUpdates(chatId,functionAfter);

        this.resetUnreadMessageCount(chatId);
    };

    /**
     * Opens listener to create new notification messages
     * @param objChat selected chat
     * @param functionAfter notifyMsg
     */
    this.openListenToNotify = function(objChat, functionAfter){
        acaoRef.child('chat-messages').child(objChat.key).on('child_added', message => {
            functionAfter(objChat.key, message.val());
        });
    };

    /**
     * Subscribes for messages from the current chat
     * @param currentChatId current chat ID
     * @param functionAfter createChatMessages
     */
    this.subscribeForMessagesUpdates = function(currentChatId, functionAfter){
        this.currentChatId = currentChatId;

        //certifica de que n�o possui listen aberto
        acaoRef.child('chat-messages').child(currentChatId).off();

        acaoRef.child('chat-messages').child(currentChatId).on('child_added', message => {
            message.val().key = message.key;
            functionAfter(currentChatId, message.val());

            //Define que j� foi lida a mensagem
            this.setMessageRead(currentChatId, message.key);

            //Notifica quando chega mensagem nova
            notifyMsg(currentChatId, message.val());
        });
        //
        // acaoRef.child('chat-messages').child(currentChatId).on('child_changed', message => {
        //     message.val().key = message.key;
        //     functionAfter(currentChatId, message.val());
        // });
    };

    /**
     * Sends new message from the current user to the current chat
     * @param messageText text for the message
     */
    this.sendMessage = function(messageText) {

        // Create empty message at chats/$currentChatId/messages and get its key so we can further reference it
        var newMessageKey = acaoRef.child('chat-messages').child(this.currentChatId).push().key;

        // Create new message with key received from Firebase
        var newMessage = {
            text: messageText,
            senderId: this.uid,
            senderEmail: this.email,
            timestamp: Date.now()
        };

        this.updateLatestMessageTimestamp(this.uid);
        var sendedMessageUserId = null;
        acaoRef.child('user-chats-properties').child(this.uid).child(this.currentChatId).child('contactId').once('value', contactId => {
            this.updateLatestMessageTimestamp(contactId.val());
            this.incrementUnreadMessageCount(contactId.val());
            sendedMessageUserId = contactId.val();
        });

        // Add newly created message to Firebase chats/$currentChatId/messages/$messageId
        acaoRef.child('chat-messages').child(this.currentChatId).child(newMessageKey).set(newMessage);

        this.sendPushNotification(sendedMessageUserId);
    };


    var cloudMessageFirBaseToken = "AAAA-nmkvHI:APA91bG09J6ocEikWsruNIg-tcEac3OcJwGuMNp45h29_6eLNg5_AD_Z_-_8eja51r3XBXK5xJqLRiyp-QyjKkwnCChx-yOKLSDJxpWjJ_nxAdGvjaRq0UVMjMwre07gQAdHqpEIPPRMOlNCu-sT6Kg14Q7_ILseag";


    this.sendPushNotification = function (userId) {
        var thisReference = this;

        acaoRef.child("notification_message").once('value', notification => {
            acaoRef.child("users").child(userId).child("fcm_token").once('value', token => {
                if (token.val() != null) {
                    this.ajaxFireBaseRequest(notification, token.val(), thisReference, userId);
                }
            });
        });
    };

    this.ajaxFireBaseRequest = function(notification, fcmToken, thisReference, userId) {
        $.ajax({
            type: 'POST',
            url: "https://fcm.googleapis.com/fcm/send",
            headers: {
                Authorization: 'key=' + cloudMessageFirBaseToken
            },
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "to": fcmToken,
                "notification": {
                    "title": notification.val().title,
                    "body": notification.val().body + this.name,
                    "sound": notification.val().sound,
                    "tag": notification.val().tag
                },
                "content_available": true,
                "priority": "high"
            }),
            success: function () {
                thisReference.insertFIRNotification(userId);
            },
            error: function (xhr) {
                console.log(xhr.error);
            }
        });
    };

    // Insert notifications in FireBase array
    this.insertFIRNotification = function (userId) {
        let targetNotifications = acaoRef.child("users").child(userId).child("notifications");
        targetNotifications.child(this.uid).once('value', countNotifications => {
            targetNotifications.child(this.uid).set(countNotifications.val() + 1);
        });
    };

    /**
     * Updates the current chat with the timestamp of the latest received message
     * @param userId
     */
    this.updateLatestMessageTimestamp = function (userId) {
        acaoRef.child('user-chats-properties').child(userId).child(this.currentChatId).child('latestMessageTimestamp').set(Date.now());
    };

    /**
     * Increments by one the timestamp of the current chat
     * @param userId
     */
    this.incrementUnreadMessageCount = function (userId) {
        let unreadMessageCountPath = acaoRef.child('user-chats-properties').child(userId).child(this.currentChatId).child("unreadMessageCount");
        unreadMessageCountPath.once('value', unreadMessageCount => {
            // TODO verificar se timestamp retornado é válido
            unreadMessageCountPath.set(unreadMessageCount.val() + 1);
        })
    };

    /**
     * Sets the unread message count of the seleted chat to zero
     * @param chatId chat ID
     */
    this.resetUnreadMessageCount = function (chatId) {
        let unreadMessageCountPath = acaoRef.child('user-chats-properties').child(this.uid).child(chatId).child("unreadMessageCount");
        unreadMessageCountPath.once('value', timestamp => {
            // TODO verificar se timestamp retornado é válido
            unreadMessageCountPath.set(0);
        })
    };

    this.setMessageRead = function (chatId, messageId) {
        acaoRef.child('chat-messages').child(chatId).child(messageId).child('isRead').set(true);
    }
}
