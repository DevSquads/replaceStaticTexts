import React from "react";
class TestClass extends React.Component {
  render() {
    return (
    <View>
   {someCondition && console.log('test')}
      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>
      <View><Text>{"Another Text"}</Text></View>
      {120}
    </View>
    );
  }
}