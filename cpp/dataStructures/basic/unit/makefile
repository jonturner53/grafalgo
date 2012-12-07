IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testList testDlist testClist testSetPair testPartition

testList: testList.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDlist: testDlist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testClist: testClist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testSetPair: testSetPair.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testPartition: testPartition.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
