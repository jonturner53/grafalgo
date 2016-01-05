IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testList testList_d testDlists testListPair testDsets \
	testList_g

testList: testList.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testList_d: testList_d.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testList_g: testList_g.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testStack: testStack.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDlists: testDlists.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testListPair: testListPair.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDsets: testDsets.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
