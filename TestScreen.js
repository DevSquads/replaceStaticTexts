import React from "react";
class TestClass extends React.Component {
  render() {
    return (
    <View>
   {someCondition && this.someCommand}
      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>
      <View><Text>{"Another Text"}</Text></View>
      {120}
    </View>
    );
  }
}