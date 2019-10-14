import React from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';

function Message({ message }) {
    return (
        <View style={styles.message}>
            <Text>{message.author}</Text>
            <Text>{message.body}</Text>
        </View>
    );
}

export default class MessageListList extends React.Component {
    render() {
        return(<FlatList
                data={this.props.messages}
                renderItem={({ item }) => <Message message={item} />}
                keyExtractor={item => item.sid}
                style = {styles.container}
            />
            )
    }
}


const styles = StyleSheet.create({
    container: {
        width: '100%'
    },
    message: {
        borderColor: 'grey',
        borderWidth: 1,
        borderRadius: 5,
        width: '100%',
    }
});