import React from 'react';
import {StyleSheet, Text, View, TextInput, Button} from 'react-native';
import {Client as TwilioChatClient} from "twilio-chat";

import ChannelList from './components/ChannelList'
import MessageList from './components/MessageList'

export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            loaded: false,
            token: '',
            channels: [],
            messages: [],
            value: ''
        }
        this.chatClient = null;
        this.currentChannel = null;
        this.onTextChange = this.onTextChange.bind(this)
        this.refreshToken = this.refreshToken.bind(this)
        this.loadChannelList = this.loadChannelList.bind(this)
        this.joinGeneralChannel = this.joinGeneralChannel.bind(this)
        this.setupChannel = this.setupChannel.bind(this)
        this.initChannel = this.initChannel.bind(this)
        this.joinChannel = this.joinChannel.bind(this)
        this.initChannelEvents = this.initChannelEvents.bind(this)
        this.leaveCurrentChannel = this.leaveCurrentChannel.bind(this)
        this.loadMessages = this.loadMessages.bind(this)
        this.addMessagesToState = this.addMessagesToState.bind(this)
        this.selectChannel = this.selectChannel.bind(this)
    }

    componentWillMount() {
        let root = this;
        fetch('https://553dc1e6.ngrok.io/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({identity: 'danny', device: 'browser'})
        })
            .then((response) => response.json())
            .then((responseJson) => {
                TwilioChatClient.create(responseJson.token).then((chatClient) => {
                    console.log('successfully started chat')
                    root.chatClient = chatClient;
                    root.loadChannelList(root.joinGeneralChannel);
                    root.chatClient.on('channelAdded', root.loadChannelList);
                    root.chatClient.on('channelRemoved', root.loadChannelList);
                    root.chatClient.on('tokenExpired', root.refreshToken);
                    this.setState({
                        token: responseJson.token
                    })
                });
            })
            .catch((error) => {
                console.error(error);
            });
    }

    refreshToken() {
        let root = this;
        fetch('https://553dc1e6.ngrok.io/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({identity: 'danny', device: 'browser'})
        })
            .then((response) => response.json())
            .then((responseJson) => {
                root.chatClient.updateToken(responseJson.token)
            })
            .catch((error) => {
                console.error(error);
            });
    }

    loadChannelList(handler) {
        console.log('loading channel list')
        let root = this;
        root.chatClient.getPublicChannelDescriptors()
            .then((channels) => {
                if (channels) {
                    this.setState({
                        channels: channels.items
                    })
                } else {
                    console.log('no channel items')
                }
                if (typeof handler === 'function') {
                    handler();
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    joinGeneralChannel() {
        let root = this;
        console.log('joining general chat')
        if (!root.generalChannel) {
            // If it doesn't exist, let's create it
            root.chatClient.createChannel({
                uniqueName: 'GENERAL_CHANNEL_UNIQUE_NAME9',
                friendlyName: 'GENERAL_CHANNEL_NAME'
            }).then(function (channel) {
                console.log('Created general channel');
                root.generalChannel = channel;
                root.loadChannelList(root.joinGeneralChannel);
            }).catch(err => console.log(err))
        }
        else {
            console.log('Found general channel:');
            this.setupChannel(root.generalChannel);
        }
    }

    leaveCurrentChannel() {
        let root = this
        if (root.currentChannel) {
            return root.currentChannel.leave().then(function(leftChannel) {
                console.log('left ' + leftChannel.friendlyName);
                leftChannel.removeListener('messageAdded', root.addMessagesToState);
            });
        } else {
            return Promise.resolve();
        }
    }

    setupChannel(channel) {
        let root = this;
        return root.leaveCurrentChannel()
            .then(function () {
                return root.initChannel(channel);
            })
            .then(function (_channel) {
                return root.joinChannel(_channel);
            })
            .then(root.initChannelEvents);
    }

    initChannel(channel) {
        console.log('Initialized channel ' + channel.friendlyName);
        return this.chatClient.getChannelBySid(channel.sid);
    }

    joinChannel(_channel) {
        let root = this;
        return _channel.join()
            .then(function(joinedChannel) {
                console.log('Joined channel ' + joinedChannel.friendlyName);
                root.currentChannel = joinedChannel;
                root.loadMessages();
                return joinedChannel;
            })
            .catch(function(err) {
                if (_channel.status == 'joined') {
                    root.currentChannel = _channel;
                    root.loadMessages();
                    return _channel;
                }
                console.error(
                    "Couldn't join channel " + _channel.friendlyName + ' because -> ' + err
                );
            });
    }

    initChannelEvents() {
        console.log(this.currentChannel.friendlyName + ' ready.');
        this.currentChannel.on('messageAdded', this.addMessagesToState);
    }

    loadMessages(){
        let root = this;
        root.currentChannel.getMessages(300).then(function (messages) {
            root.setState({
                messages: messages.items
            });
        });
    }

    addMessagesToState(message){
        let prevMessages = this.state.messages;
        this.setState({
            messages: prevMessages.concat([message])
        });
    }

    onTextChange(text){
        this.setState({
            value: text
        })
    }

    selectChannel(channelSid) {
        let root = this;
        let selectedChannel = this.state.channels.filter(function(channel) {
            return channel.sid === channelSid;
        })[0];
        if (selectedChannel === this.currentChannel) {
            return;
        }
        root.setupChannel(selectedChannel);
    };

    render() {
        return (
            <View style={styles.container}>
                <Text>Channels:</Text>
                <ChannelList channels={this.state.channels} selectChannel={this.selectChannel}/>
                <Text>Messages:</Text>
                <MessageList messages={this.state.messages}/>
                <TextInput
                    style={styles.input}
                    onChangeText={text => this.onTextChange(text)}
                           value={this.state.value}/>
                <Button
                    title="Send"
                    onPress={() => {
                        this.currentChannel.sendMessage(this.state.value)
                        this.setState({value: ''})
                    }}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: 'gray',
        borderWidth: 1
    }
});
