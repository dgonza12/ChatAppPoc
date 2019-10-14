import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Client as TwilioChatClient} from "twilio-chat";

export default class ChannelList extends React.Component {
    constructor() {
        super();
        this.renderChannelRows = this.renderChannelRows.bind(this)
    }

    renderChannelRows(){
        let channelRows = [];
        this.props.channels.forEach((channel) => {
            channelRows.push(<Text key={channel.sid}
                onPress={()=> {this.props.selectChannel(channel.sid)}}
            >{channel.friendlyName}</Text>)
        });
        return(channelRows)
    }

    render() {
        return (
            <View style={styles.container}>
                {this.renderChannelRows()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        alignItems: 'center',
    },
});